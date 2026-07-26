<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LeaveRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['user:id,name,staff_id', 'leaveType:id,name'])
            ->orderBy('id', 'desc');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('staff_id', 'like', "%{$search}%");
            });
        }

        $perPage = $request->integer('per_page', 50);
        $requests = $query->paginate($perPage);

        // Map to match the frontend expected structure
        $mapped = $requests->map(function ($req) {
            return [
                'id' => $req->id,
                'staff' => $req->user->name . ' (' . $req->user->staff_id . ')',
                'staffId' => $req->user->staff_id,
                'leaveType' => $req->leaveType->name ?? 'Unknown',
                'halfDay' => $req->half_day ?? '',
                'leaveDate' => $req->leave_from->format('m/d/Y') . ' - ' . $req->leave_to->format('m/d/Y'),
                'days' => number_format($req->days, 2),
                'applyDate' => $req->apply_date->format('m/d/Y'),
                'status' => $req->status,
                'reason' => $req->reason,
                'adminRemark' => $req->admin_remark,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $mapped,
            'meta' => [
                'total' => $requests->total(),
                'page' => $requests->currentPage(),
                'per_page' => $requests->perPage(),
                'last_page' => $requests->lastPage()
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'leave_from' => 'required|date',
            'leave_to' => 'required|date|after_or_equal:leave_from',
            'days' => 'required|numeric|min:0.5',
            'apply_date' => 'required|date',
            'half_day' => 'nullable|in:First Half,Second Half',
            'reason' => 'nullable|string',
            'status' => 'nullable|in:Pending,Approved,Disapproved',
            'admin_remark' => 'nullable|string'
        ]);

        $leave = LeaveRequest::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Leave request submitted.',
            'data' => $leave
        ]);
    }

    public function updateStatus(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:Pending,Approved,Disapproved',
            'admin_remark' => 'nullable|string'
        ]);

        $leaveRequest->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Leave request status updated.',
            'data' => $leaveRequest
        ]);
    }

    public function destroy(LeaveRequest $leaveRequest): JsonResponse
    {
        $leaveRequest->delete();
        return response()->json([
            'success' => true,
            'message' => 'Leave request deleted.'
        ]);
    }
}
