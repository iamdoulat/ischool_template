<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\AcademicSession;

class AlumniReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/alumni/criteria                                      */
    /** ------------------------------------------------------------------ */
    public function getCriteria()
    {
        return response()->json([
            'classes' => SchoolClass::with('sections')->get(),
            'sections' => Section::all(),
            'sessions' => AcademicSession::all(),
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/alumni/search                                        */
    /** ------------------------------------------------------------------ */
    public function getAlumniReport(Request $request)
    {
        $sessionId = $request->query('session_id');
        $classId = $request->query('class_id');
        $sectionId = $request->query('section_id');

        $query = User::query()
            ->where('role', 'Student')
            ->with([
                'schoolClass',
                'section',
                'academicSession'
            ]);

        if ($sessionId) {
            $query->where('academic_session_id', $sessionId);
        }

        if ($classId) {
            $query->where('school_class_id', $classId);
        }

        if ($sectionId && $sectionId !== 'all') {
            $query->where('section_id', $sectionId);
        }

        $students = $query->get()->map(function ($student) {
            return [
                'admission_no'    => $student->admission_no ?? '-',
                'student_name'    => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'class'           => $student->schoolClass ? ($student->schoolClass->name . ($student->section ? ' (' . $student->section->name . ')' : '')) : '-',
                'gender'          => $student->gender ?? '-',
                'current_email'   => $student->email ?? '-',
                'dob'             => $student->dob ? $student->dob->format('Y-m-d') : '-',
                'current_address' => $student->current_address ?? '-',
                'occupation'      => '-',
                'current_phone'   => $student->phone ?? '-',
            ];
        });

        return response()->json([
            'data' => $students,
        ]);
    }
}
