<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Controller;
use App\Models\StaffAttendance;
use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffAttendanceController extends Controller
{
    /**
     * Get staff list with their attendance for a given date.
     * GET /api/v1/hr/staff-attendance?role=Teacher&date=2026-02-21
     */
    public function getStaff(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
            'role' => 'nullable|string',
        ]);

        $date = $request->query('date');
        $role = $request->query('role');

        $query = User::whereNotIn('role', ['Student', 'Parent'])
            ->where('active', true);

        if ($role) {
            $query->where('role', $role);
        }

        $staff = $query->orderBy('name')->get(['id', 'staff_id', 'name', 'role']);

        // Get any existing attendance records for this date
        $attendances = StaffAttendance::where('attendance_date', $date)
            ->whereIn('user_id', $staff->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $result = $staff->map(function ($member) use ($attendances, $date) {
            $record = $attendances->get($member->id);
            return [
                'id' => $member->id,
                'staff_id' => $member->staff_id,
                'name' => $member->name,
                'role' => $member->role,
                'attendance' => $record?->attendance ?? 'absent',
                'date' => $date,
                'source' => $record?->source ?? 'Manual',
                'entry_time' => $record?->entry_time ?? '',
                'exit_time' => $record?->exit_time ?? '',
                'note' => $record?->note ?? '',
            ];
        });

        return response()->json(['success' => true, 'data' => $result]);
    }

    /**
     * Save/upsert attendance records for multiple staff on a date.
     * POST /api/v1/hr/staff-attendance
     */
    public function saveAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.user_id' => 'required|integer|exists:users,id',
            'records.*.attendance' => 'required|in:present,late,absent,half_day,holiday,half_day_second',
            'records.*.entry_time' => 'nullable|date_format:H:i',
            'records.*.exit_time' => 'nullable|date_format:H:i',
            'records.*.note' => 'nullable|string|max:500',
        ]);

        $date = $request->input('date');
        $records = $request->input('records');

        DB::transaction(function () use ($date, $records) {
            foreach ($records as $rec) {
                StaffAttendance::updateOrCreate(
                    [
                        'user_id' => $rec['user_id'],
                        'attendance_date' => $date,
                    ],
                    [
                        'attendance' => $rec['attendance'],
                        'source' => 'Manual',
                        'entry_time' => $rec['entry_time'] ?? null,
                        'exit_time' => $rec['exit_time'] ?? null,
                        'note' => $rec['note'] ?? null,
                    ]
                );
            }
        });

        foreach ($records as $rec) {
            $staff = User::find($rec['user_id']);
            if (!$staff) continue;
            $eventName = in_array($rec['attendance'], ['present', 'late']) ? 'Staff Present Attendance' : 'Staff Absent Attendance';
            NotificationDispatcher::dispatch($eventName, [
                'staff_name' => $staff->name ?? '',
                'employee_id' => $staff->staff_id ?? $staff->admission_no ?? '',
                'attendance_date' => $date ?? '',
                'entry_time' => $rec['entry_time'] ?? '',
                'reason' => $rec['note'] ?? 'Manual',
            ], [
                'staff_id' => $staff->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Attendance saved successfully for ' . count($records) . ' staff members.',
        ]);
    }
}
