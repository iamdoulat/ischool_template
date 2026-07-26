<?php

namespace App\Http\Controllers\Api\v1\Certificate;

use App\Http\Controllers\Controller;
use App\Models\TransferCertificate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TransferCertificateController extends Controller
{
    public function index(Request $request)
    {
        $query = TransferCertificate::query()
            ->with(['student:id,name,last_name,admission_no,phone,gender,category,dob,school_class_id,section_id'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = '%' . $request->search . '%';
                $q->where(function ($inner) use ($s) {
                    $inner->where('student_name', 'like', $s)
                          ->orWhere('admission_no', 'like', $s)
                          ->orWhere('tc_number', 'like', $s);
                });
            })
            ->when($request->filled('school_class_id'), fn($q) => $q->where('school_class_id', $request->school_class_id))
            ->when($request->filled('section_id'), fn($q) => $q->where('section_id', $request->section_id))
            ->orderByDesc('id');

        $perPage = (int) ($request->per_page ?? 10);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Issue a TC for a student.
     * If a previous record already exists for this student, the new one is marked as a reissue.
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|integer|exists:users,id',
        ]);

        $studentId = $request->integer('student_id');

        /** @var User|null $student */
        $student = User::where('id', $studentId)->where('role', 'Student')
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->first();

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $previousExists = TransferCertificate::where('student_id', $studentId)->exists();

        // Generate a unique TC number
        $year   = now()->format('Y');
        $serial = str_pad(TransferCertificate::whereYear('created_at', $year)->count() + 1, 4, '0', STR_PAD_LEFT);
        $tcNumber = "TC-{$year}-{$serial}";

        $issueDate = $request->filled('issue_date')
            ? Carbon::parse($request->issue_date)->toDateString()
            : today()->toDateString();

        $meta = [
            'name'           => trim($student->name . ($student->last_name ? ' ' . $student->last_name : '')),
            'admission_no'   => $student->admission_no ?? '',
            'class'          => $student->schoolClass->name ?? '',
            'section'        => $student->section->name ?? '',
            'gender'         => $student->gender ?? '',
            'dob'            => $student->dob ? date('m/d/Y', strtotime($student->dob)) : '',
            'father_name'    => $student->father_name ?? '',
            'mother_name'    => $student->mother_name ?? '',
            'category'       => $student->category ?? '',
            'phone'          => $student->phone ?? '',
            'email'          => $student->email ?? '',
            'religion'       => $student->religion ?? '',
            'present_address'=> $student->current_address ?? '',
            'admission_date' => $student->admission_date ? date('m/d/Y', strtotime($student->admission_date)) : '',
            'issue_date'     => date('m/d/Y', strtotime($issueDate)),
            'reason'         => $request->reason ?? '',
            'tc_number'      => $tcNumber,
        ];

        $tc = TransferCertificate::create([
            'tc_number'       => $tcNumber,
            'student_id'      => $studentId,
            'school_class_id' => $student->school_class_id,
            'section_id'      => $student->section_id,
            'student_name'    => $meta['name'],
            'admission_no'    => $meta['admission_no'],
            'reason'          => $request->reason,
            'issue_date'      => $issueDate,
            'is_reissue'      => $previousExists,
            'meta'            => $meta,
        ]);

        return response()->json([
            'message' => 'Transfer certificate issued successfully.',
            'data'    => $tc,
        ], 201);
    }

    public function show($id)
    {
        $tc = TransferCertificate::with(['student:id,name,last_name,admission_no'])
            ->findOrFail($id);

        return response()->json($tc);
    }

    public function destroy($id)
    {
        TransferCertificate::findOrFail($id)->delete();

        return response()->json(['message' => 'Transfer certificate deleted successfully.']);
    }

    /**
     * Verify a TC by its TC number.
     * GET /certificate/transfer-certificates/verify?tc_number=TC-2026-0001
     */
    public function verify(Request $request)
    {
        $request->validate(['tc_number' => 'required|string']);

        $tc = TransferCertificate::where('tc_number', $request->tc_number)
            ->with(['student:id,name,last_name,admission_no'])
            ->first();

        if (!$tc) {
            return response()->json(['message' => 'No transfer certificate found with that TC number.', 'data' => null], 404);
        }

        return response()->json(['message' => 'Transfer certificate verified.', 'data' => $tc]);
    }
}
