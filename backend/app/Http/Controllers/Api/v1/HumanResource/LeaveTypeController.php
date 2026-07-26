<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Api\BaseController;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveTypeController extends BaseController
{
    public function index()
    {
        $leaveTypes = LeaveType::all();
        return $this->success($leaveTypes, 'Leave types retrieved successfully.');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:leave_types,name',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $leaveType = LeaveType::create($request->only(['name']));
        return $this->success($leaveType, 'Leave type created successfully.', 201);
    }

    public function show($id)
    {
        $leaveType = LeaveType::find($id);
        if (!$leaveType) {
            return $this->error('Leave type not found', 404);
        }
        return $this->success($leaveType, 'Leave type retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $leaveType = LeaveType::find($id);
        if (!$leaveType) {
            return $this->error('Leave type not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:leave_types,name,' . $id,
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $leaveType->update($request->only(['name']));
        return $this->success($leaveType, 'Leave type updated successfully.');
    }

    public function destroy($id)
    {
        $leaveType = LeaveType::find($id);
        if (!$leaveType) {
            return $this->error('Leave type not found', 404);
        }
        $leaveType->delete();
        return $this->success(null, 'Leave type deleted successfully.');
    }
}
