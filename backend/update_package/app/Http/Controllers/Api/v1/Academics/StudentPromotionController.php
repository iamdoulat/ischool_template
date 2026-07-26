<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentPromotionController extends BaseController
{
    /**
     * Search students for promotion.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
        ]);

        $students = User::where('role', 'Student')
            ->where('active', true)
            ->when($request->filled('academic_session_id'), function ($q) use ($request) {
                $q->where(function ($sq) use ($request) {
                    $sq->where('academic_session_id', $request->academic_session_id)
                       ->orWhereNull('academic_session_id');
                });
            })
            ->where('school_class_id', $request->school_class_id)
            ->where(function ($sq) use ($request) {
                $sq->where('section_id', $request->section_id)
                   ->orWhereNull('section_id');
            })
            ->select('id', 'admission_no', 'name', 'last_name', 'father_name', 'dob')
            ->get()
            ->map(function ($student) {
                $dobFormatted = '-';
                if ($student->dob) {
                    if (is_string($student->dob)) {
                        $dobFormatted = $student->dob;
                    } elseif (method_exists($student->dob, 'format')) {
                        $dobFormatted = $student->dob->format('d/m/Y');
                    }
                }
                return [
                    'id' => $student->id,
                    'admission_no' => $student->admission_no ?? ('STD-' . str_pad((string)$student->id, 4, '0', STR_PAD_LEFT)),
                    'name' => trim($student->name . ' ' . ($student->last_name ?? '')),
                    'father_name' => $student->father_name ?? '-',
                    'dob' => $dobFormatted,
                ];
            });

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Promote students to next session/class/section.
     */
    public function promote(Request $request): JsonResponse
    {
        $request->validate([
            'promote_session_id' => 'required|exists:academic_sessions,id',
            'promote_class_id' => 'required|exists:school_classes,id',
            'promote_section_id' => 'required|exists:sections,id',
            'students' => 'required|array',
            'students.*.id' => 'required|exists:users,id',
            'students.*.result' => 'required|in:pass,fail',
            'students.*.status' => 'required|in:continue,leave',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->students as $studentData) {
                $user = User::findOrFail($studentData['id']);

                // If student is leaving, we might mark them as inactive or just not move them
                // For "continue" and "pass", we move them to the new session/class/section
                if ($studentData['status'] === 'continue') {
                    $user->update([
                        'academic_session_id' => $request->promote_session_id,
                        'school_class_id' => $request->promote_class_id,
                        'section_id' => $request->promote_section_id,
                    ]);
                } else {
                    $user->update([
                        'active' => false
                    ]);
                }
            }
            DB::commit();
            return $this->success(null, 'Students promoted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to promote students: ' . $e->getMessage(), 500);
        }
    }
}
