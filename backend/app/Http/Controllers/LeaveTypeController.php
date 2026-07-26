<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LeaveTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = LeaveType::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name',
        ]);

        $type = LeaveType::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Leave type created successfully.',
            'data' => $type
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $leaveType = LeaveType::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name,' . $id,
        ]);

        $leaveType->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Leave type updated successfully.',
            'data' => $leaveType
        ]);
    }

    public function destroy($leave_type): JsonResponse
    {
        $type = LeaveType::findOrFail($leave_type);
        $type->delete();

        return response()->json([
            'success' => true,
            'message' => 'Leave type deleted successfully.'
        ]);
    }
}
