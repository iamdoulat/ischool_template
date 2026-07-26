<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontOfficeSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FrontOfficeSourceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = FrontOfficeSource::latest();
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }
        $sources = $query->paginate($request->get('limit', 15));
        return $this->success($sources, 'Sources retrieved successfully');
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
        $source = FrontOfficeSource::create($request->all());
        return $this->success($source, 'Source created successfully', 201);
    }

    public function show(FrontOfficeSource $front_office_source): JsonResponse
    {
        return $this->success($front_office_source, 'Source details retrieved successfully');
    }

    public function update(Request $request, FrontOfficeSource $front_office_source): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }
        $front_office_source->update($request->all());
        return $this->success($front_office_source, 'Source updated successfully');
    }

    public function destroy(FrontOfficeSource $front_office_source): JsonResponse
    {
        $front_office_source->delete();
        return $this->success(null, 'Source deleted successfully');
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return $this->error('No IDs provided for deletion', 400);
        }
        FrontOfficeSource::whereIn('id', $ids)->delete();
        return $this->success(null, count($ids) . ' sources deleted successfully');
    }
}
