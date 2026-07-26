<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Api\BaseController;
use App\Models\LeaveRequest;
use App\Models\StudentAttendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentLeaveController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::query()
            ->with(['user.schoolClass', 'user.section', 'leaveType'])
            ->whereHas('user', function ($q) {
                $q->where('role', 'Student');
            });

        if ($request->school_class_id) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('school_class_id', $request->school_class_id);
            });
        }

        if ($request->section_id) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('section_id', $request->section_id);
            });
        }

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('admission_no', 'like', '%' . $request->search . '%');
            });
        }

        $leaves = $query->orderBy('apply_date', 'desc')->get();

        return $this->success($leaves, 'Leave requests retrieved successfully');
    }

    /**
     * Pre-check if the student already has a leave application in the date range.
     */
    public function checkExisting(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'leave_from' => 'required|date',
            'leave_to' => 'required|date|after_or_equal:leave_from',
        ]);

        $existing = LeaveRequest::where('user_id', $request->user_id)
            ->whereIn('status', ['Pending', 'Approved'])
            ->where(function ($q) use ($request) {
                $q->whereBetween('leave_from', [$request->leave_from, $request->leave_to])
                  ->orWhereBetween('leave_to', [$request->leave_from, $request->leave_to])
                  ->orWhere(function ($q2) use ($request) {
                      $q2->where('leave_from', '<=', $request->leave_from)
                         ->where('leave_to', '>=', $request->leave_to);
                  });
            })
            ->exists();

        return response()->json([
            'status' => 'Success',
            'success' => true,
            'data' => ['exists' => $existing],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'apply_date' => 'required|date',
            'leave_from' => 'required|date',
            'leave_to' => 'required|date|after_or_equal:leave_from',
            'reason' => 'nullable|string',
            'status' => 'required|in:Pending,Approved,Disapproved',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        // Duplicate check — reject if overlapping leave exists (Pending or Approved)
        $existing = LeaveRequest::where('user_id', $validated['user_id'])
            ->whereIn('status', ['Pending', 'Approved'])
            ->where(function ($q) use ($validated) {
                $q->whereBetween('leave_from', [$validated['leave_from'], $validated['leave_to']])
                  ->orWhereBetween('leave_to', [$validated['leave_from'], $validated['leave_to']])
                  ->orWhere(function ($q2) use ($validated) {
                      $q2->where('leave_from', '<=', $validated['leave_from'])
                         ->where('leave_to', '>=', $validated['leave_to']);
                  });
            })
            ->exists();

        if ($existing) {
            return response()->json([
                'status' => 'Error',
                'success' => false,
                'message' => 'This student already has a leave application in the selected date range.',
            ], 422);
        }

        // Calculate days
        $from = new \DateTime($validated['leave_from']);
        $to = new \DateTime($validated['leave_to']);
        $validated['days'] = $to->diff($from)->days + 1;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/leave_documents'), $filename);
            $validated['attachment'] = 'uploads/leave_documents/' . $filename;
        }

        $leave = LeaveRequest::create($validated);

        // If status is already Approved, auto-create on_leave attendance records
        if ($validated['status'] === 'Approved') {
            $this->syncOnLeaveAttendance($leave);
        }

        $leave->load(['user.schoolClass', 'user.section', 'leaveType']);

        \App\Services\NotificationDispatcher::dispatch('Student Apply Leave', [
            'student_name' => $leave->user->name ?? '',
            'class' => $leave->user->schoolClass->name ?? '',
            'section' => $leave->user->section->name ?? '',
            'apply_date' => $leave->apply_date,
            'from_date' => $leave->leave_from,
            'to_date' => $leave->leave_to,
            'message' => $leave->reason ?? '',
        ], [
            'user_id' => $leave->user_id,
            'student_id' => $leave->user_id,
        ]);

        return $this->success($leave, 'Leave request created successfully', 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'apply_date' => 'required|date',
            'leave_from' => 'required|date',
            'leave_to' => 'required|date|after_or_equal:leave_from',
            'reason' => 'nullable|string',
            'status' => 'required|in:Pending,Approved,Disapproved',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        $from = new \DateTime($validated['leave_from']);
        $to = new \DateTime($validated['leave_to']);
        $validated['days'] = $to->diff($from)->days + 1;

        $oldStatus = $leave->status;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/leave_documents'), $filename);
            $validated['attachment'] = 'uploads/leave_documents/' . $filename;
        }

        $leave->update($validated);

        // Sync on_leave attendance when Approved
        if ($validated['status'] === 'Approved') {
            $this->removeOnLeaveAttendance($leave);
            $this->syncOnLeaveAttendance($leave->fresh());
        } elseif ($oldStatus === 'Approved') {
            $this->removeOnLeaveAttendance($leave);
        }

        return $this->success($leave->load(['user.schoolClass', 'user.section', 'leaveType']), 'Leave request updated successfully');
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:Approved,Disapproved,Pending',
            'admin_remark' => 'nullable|string',
        ]);

        $leave = LeaveRequest::findOrFail($id);
        $oldStatus = $leave->status;
        $leave->update([
            'status' => $request->status,
            'admin_remark' => $request->admin_remark,
        ]);

        // When leave is Approved, create on_leave attendance records
        if ($request->status === 'Approved' && $oldStatus !== 'Approved') {
            $this->syncOnLeaveAttendance($leave->fresh());
        }

        // When leave is Disapproved/Pending (was Approved before), remove on_leave records
        if ($request->status !== 'Approved' && $oldStatus === 'Approved') {
            $this->removeOnLeaveAttendance($leave);
        }

        return $this->success($leave->load(['user.schoolClass', 'user.section', 'leaveType']), 'Leave status updated successfully');
    }

    public function destroy($id): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        // Remove any on_leave attendance records for this leave
        $this->removeOnLeaveAttendance($leave);

        $leave->delete();
        return $this->success(null, 'Leave request deleted successfully');
    }

    /**
     * Create or update on_leave attendance records for each date in the leave range.
     */
    private function syncOnLeaveAttendance(LeaveRequest $leave): void
    {
        $from = \Carbon\Carbon::parse($leave->leave_from);
        $to = \Carbon\Carbon::parse($leave->leave_to);

        $current = $from->copy();
        while ($current <= $to) {
            StudentAttendance::updateOrCreate(
                [
                    'student_id' => $leave->user_id,
                    'attendance_date' => $current->toDateString(),
                ],
                [
                    'attendance' => 'on_leave',
                    'reason' => 'Leave: ' . ($leave->leaveType->name ?? ''),
                    'note' => $leave->reason,
                    'source' => 'Leave System',
                ]
            );
            $current->addDay();
        }
    }

    /**
     * Remove on_leave attendance records for this leave.
     */
    private function removeOnLeaveAttendance(LeaveRequest $leave): void
    {
        StudentAttendance::where('student_id', $leave->user_id)
            ->whereBetween('attendance_date', [$leave->leave_from, $leave->leave_to])
            ->where('attendance', 'on_leave')
            ->delete();
    }
}
