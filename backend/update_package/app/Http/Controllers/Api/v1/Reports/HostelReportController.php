<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Hostel;

class HostelReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/hostel/criteria                                      */
    /** ------------------------------------------------------------------ */
    public function getCriteria()
    {
        return response()->json([
            'classes' => SchoolClass::with('sections')->get(),
            'sections' => Section::all(),
            'hostels' => Hostel::all(),
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/hostel/search                                        */
    /** ------------------------------------------------------------------ */
    public function getHostelReport(Request $request)
    {
        $classId = $request->query('class_id');
        $sectionId = $request->query('section_id');
        $hostelId = $request->query('hostel_id');

        $query = User::query()
            ->where('role', 'Student')
            ->whereNotNull('hostel_id')
            ->with([
                'schoolClass',
                'section',
                'hostel',
                'room.roomType'
            ]);

        if ($classId) {
            $query->where('school_class_id', $classId);
        }

        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }

        if ($hostelId) {
            $query->where('hostel_id', $hostelId);
        }

        $students = $query->get()->map(function ($student) {
            return [
                'class'          => $student->schoolClass ? ($student->schoolClass->name . ($student->section ? ' (' . $student->section->name . ')' : '')) : '-',
                'admission_no'   => $student->admission_no ?? '-',
                'student_name'   => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'mobile_number'  => $student->phone ?? '-',
                'guardian_phone' => $student->guardian_phone ?? '-',
                'hostel_name'    => optional($student->hostel)->name ?? '-',
                'room_number'    => optional($student->room)->room_number ?? '-',
                'room_type'      => optional(optional($student->room)->roomType)->name ?? '-',
                'cost'           => optional($student->room)->cost_per_bed ? (float) $student->room->cost_per_bed : 0.0,
            ];
        });

        return response()->json([
            'data' => $students,
        ]);
    }
}
