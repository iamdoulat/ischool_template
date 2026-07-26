<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\PeriodAttendance;
use App\Models\SubjectGroup;
use App\Models\ClassTimetable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PeriodAttendanceController extends BaseController
{
    /**
     * Get subjects for a class and section.
     */
    public function getSubjects(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
        ]);

        $subjectGroups = SubjectGroup::where('school_class_id', $request->school_class_id)
            ->whereHas('sections', function ($query) use ($request) {
                $query->where('sections.id', $request->section_id);
            })
            ->with('subjects')
            ->get();

        $subjects = $subjectGroups->pluck('subjects')->flatten()->unique('id');

        return $this->success($subjects->values(), 'Subjects retrieved successfully');
    }

    /**
     * Get students and their period attendance.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
            'subject_id' => 'required',
            'attendance_date' => 'required|date',
        ]);

        $students = User::query()
            ->where('role', 'Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->with(['periodAttendances' => function ($query) use ($request) {
                $query->where('attendance_date', $request->attendance_date)
                      ->where('subject_id', $request->subject_id);
            }])
            ->get();

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Save period attendance.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'attendance_date' => 'required|date',
            'subject_id' => 'required|exists:subjects,id',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.attendance' => 'required|in:present,late,absent,holiday,half_day',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->attendances as $record) {
                PeriodAttendance::updateOrCreate(
                    [
                        'student_id' => $record['student_id'],
                        'attendance_date' => $request->attendance_date,
                        'subject_id' => $request->subject_id,
                    ],
                    [
                        'attendance' => $record['attendance'],
                        'note' => $record['note'] ?? null,
                    ]
                );
            }
            DB::commit();
            return $this->success(null, 'Period attendance saved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to save period attendance: ' . $e->getMessage());
        }
    }

    /**
     * Get period attendance report for a specific date.
     */
    public function reportByDate(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
            'attendance_date' => 'required|date',
        ]);

        $date = \Carbon\Carbon::parse($request->attendance_date);
        $dayName = $date->format('l');

        $students = User::query()
            ->where('role', 'Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->with(['periodAttendances' => function ($query) use ($request) {
                $query->where('attendance_date', $request->attendance_date);
            }])
            ->get();

        $timetable = ClassTimetable::where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->where('day', $dayName)
            ->with('subject')
            ->orderBy('start_time')
            ->get();

        return $this->success([
            'students' => $students,
            'timetable' => $timetable
        ], 'Report retrieved successfully');
    }
}
