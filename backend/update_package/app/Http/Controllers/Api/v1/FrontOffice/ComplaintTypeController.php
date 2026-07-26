<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\ComplaintType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ComplaintTypeController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = ComplaintType::latest();
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }
        $types = $query->paginate($request->get('limit', 15));
        return $this->success($types, 'Complaint types retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }
        $type = ComplaintType::create($request->all());
        return $this->success($type, 'Complaint type created successfully', 201);
    }

    public function show(ComplaintType $complaint_type): JsonResponse
    {
        return $this->success($complaint_type, 'Complaint type details retrieved successfully');
    }

    public function update(Request $request, ComplaintType $complaint_type): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }
        $complaint_type->update($request->all());
        return $this->success($complaint_type, 'Complaint type updated successfully');
    }

    public function destroy(ComplaintType $complaint_type): JsonResponse
    {
        $complaint_type->delete();
        return $this->success(null, 'Complaint type deleted successfully');
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return $this->error('No IDs provided for deletion', 400);
        }
        ComplaintType::whereIn('id', $ids)->delete();
        return $this->success(null, count($ids) . ' complaint types deleted successfully');
    }
}
