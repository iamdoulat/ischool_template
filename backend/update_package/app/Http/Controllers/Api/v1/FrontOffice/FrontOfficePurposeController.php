<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontOfficePurpose;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FrontOfficePurposeController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = FrontOfficePurpose::latest();

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $purposes = $query->paginate($request->get('limit', 15));
        return $this->success($purposes, 'Purposes retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $purpose = FrontOfficePurpose::create($request->all());
        return $this->success($purpose, 'Purpose created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(FrontOfficePurpose $front_office_purpose): JsonResponse
    {
        return $this->success($front_office_purpose, 'Purpose details retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FrontOfficePurpose $front_office_purpose): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $front_office_purpose->update($request->all());
        return $this->success($front_office_purpose, 'Purpose updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FrontOfficePurpose $front_office_purpose): JsonResponse
    {
        $front_office_purpose->delete();
        return $this->success(null, 'Purpose deleted successfully');
    }

    /**
     * Bulk delete resources.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return $this->error('No IDs provided for deletion', 400);
        }

        FrontOfficePurpose::whereIn('id', $ids)->delete();
        return $this->success(null, count($ids) . ' purposes deleted successfully');
    }
}
