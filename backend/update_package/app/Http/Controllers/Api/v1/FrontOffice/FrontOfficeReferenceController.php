<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontOfficeReference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FrontOfficeReferenceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = FrontOfficeReference::latest();
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }
        $references = $query->paginate($request->get('limit', 15));
        return $this->success($references, 'References retrieved successfully');
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
        $reference = FrontOfficeReference::create($request->all());
        return $this->success($reference, 'Reference created successfully', 201);
    }

    public function show(FrontOfficeReference $front_office_reference): JsonResponse
    {
        return $this->success($front_office_reference, 'Reference details retrieved successfully');
    }

    public function update(Request $request, FrontOfficeReference $front_office_reference): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }
        $front_office_reference->update($request->all());
        return $this->success($front_office_reference, 'Reference updated successfully');
    }

    public function destroy(FrontOfficeReference $front_office_reference): JsonResponse
    {
        $front_office_reference->delete();
        return $this->success(null, 'Reference deleted successfully');
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return $this->error('No IDs provided for deletion', 400);
        }
        FrontOfficeReference::whereIn('id', $ids)->delete();
        return $this->success(null, count($ids) . ' references deleted successfully');
    }
}
