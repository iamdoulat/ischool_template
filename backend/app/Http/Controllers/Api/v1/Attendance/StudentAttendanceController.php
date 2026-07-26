<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\StudentAttendance;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StudentAttendanceController extends BaseController
{
    /**
     * Get students for attendance.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
            'attendance_date' => 'required|date',
        ]);

        \Illuminate\Support\Facades\Log::info('Attendance Search Request', [
            'school_class_id' => $request->school_class_id,
            'section_id' => $request->section_id,
            'attendance_date' => $request->attendance_date,
        ]);

        $students = User::query()
            ->where('role', 'Student')
            ->where('active', 1)
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->with(['attendances' => function ($query) use ($request) {
                $query->where('attendance_date', $request->attendance_date);
            }, 'leaveRequests' => function ($query) use ($request) {
                $query->where('status', 'Approved')
                    ->whereDate('leave_from', '<=', $request->attendance_date)
                    ->whereDate('leave_to', '>=', $request->attendance_date);
            }])
            ->orderBy('roll_no')
            ->get();

        \Illuminate\Support\Facades\Log::info('Attendance Search Results', [
            'count' => $students->count(),
            'student_ids' => $students->pluck('id')->toArray(),
        ]);

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Save student attendance.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'attendance_date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.attendance' => 'required|in:present,late,absent,holiday,half_day,on_leave',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->attendances as $record) {
                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $record['student_id'],
                        'attendance_date' => $request->attendance_date,
                    ],
                    [
                        'attendance' => $record['attendance'],
                        'reason' => $record['reason'] ?? 'Manual',
                        'entry_time' => $record['entry_time'] ?? null,
                        'exit_time' => $record['exit_time'] ?? null,
                        'note' => $record['note'] ?? null,
                    ]
                );
            }
            DB::commit();

            foreach ($request->attendances as $record) {
                $student = User::find($record['student_id']);
                if (!$student) continue;
                $eventName = in_array($record['attendance'], ['present', 'late']) ? 'Student Present Attendance' : 'Student Absent Attendance';
                NotificationDispatcher::dispatch($eventName, [
                    'student_name' => $student->name ?? '',
                    'admission_no' => $student->admission_no ?? '',
                    'class' => $student->schoolClass?->name ?? '',
                    'section' => $student->section?->name ?? '',
                    'attendance_date' => $request->attendance_date ?? '',
                    'entry_time' => $record['entry_time'] ?? '',
                    'reason' => $record['reason'] ?? 'Manual',
                ], [
                    'student_id' => $student->id,
                    'guardian_id' => $student->guardian?->id ?? null,
                ]);
            }

            return $this->success(null, 'Attendance saved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to save attendance: ' . $e->getMessage());
        }
    }
}
