<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Api\BaseController;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveRequestController extends BaseController
{
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['user', 'leaveType']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhereHas('leaveType', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 50);
        $leaveRequests = $query->latest()->paginate($perPage);

        // Transform the data for the frontend
        $transformedData = collect($leaveRequests->items())->map(function ($item) {
            return [
                'id' => $item->id,
                'staff' => $item->user->name ?? 'Unknown',
                'staffId' => $item->user->staff_id ?? 'N/A',
                'leaveType' => $item->leaveType->name ?? 'Unknown',
                'halfDay' => $item->half_day ?: 'No',
                'leaveDate' => $item->leave_from->format('Y-m-d') . ' - ' . $item->leave_to->format('Y-m-d'),
                'days' => $item->days,
                'applyDate' => $item->apply_date->format('Y-m-d'),
                'status' => $item->status,
                'reason' => $item->reason,
                'adminRemark' => $item->admin_remark,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedData,
            'meta' => [
                'total' => $leaveRequests->total(),
                'page' => $leaveRequests->currentPage(),
                'per_page' => $leaveRequests->perPage(),
                'last_page' => $leaveRequests->lastPage(),
            ],
            'message' => 'Leave requests retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'leave_from' => 'required|date',
            'leave_to' => 'required|date|after_or_equal:leave_from',
            'days' => 'required|numeric',
            'apply_date' => 'required|date',
            'status' => 'required|in:Pending,Approved,Disapproved',
            'reason' => 'nullable|string',
            'admin_remark' => 'nullable|string',
            'half_day' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $leaveRequest = LeaveRequest::create($request->only([
            'user_id',
            'leave_type_id',
            'leave_from',
            'leave_to',
            'days',
            'apply_date',
            'half_day',
            'status',
            'reason',
            'attachment',
            'admin_remark',
        ]));
        return $this->success($leaveRequest, 'Leave request created successfully.', 201);
    }

    public function show($id)
    {
        $leaveRequest = LeaveRequest::with(['user', 'leaveType'])->find($id);
        if (!$leaveRequest) {
            return $this->error('Leave request not found', 404);
        }
        return $this->success($leaveRequest, 'Leave request retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $leaveRequest = LeaveRequest::find($id);
        if (!$leaveRequest) {
            return $this->error('Leave request not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:Pending,Approved,Disapproved',
            'admin_remark' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $leaveRequest->update($request->only(['status', 'admin_remark']));
        return $this->success($leaveRequest, 'Leave request updated successfully.');
    }

    public function destroy($id)
    {
        $leaveRequest = LeaveRequest::find($id);
        if (!$leaveRequest) {
            return $this->error('Leave request not found', 404);
        }
        $leaveRequest->delete();
        return $this->success(null, 'Leave request deleted successfully.');
    }
}
