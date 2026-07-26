<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\SystemField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemFieldController extends BaseController
{
    /**
     * Get system fields, optionally filtered by scope (student|staff).
     */
    public function index(Request $request): JsonResponse
    {
        $query = SystemField::orderBy('id', 'asc');

        if ($request->filled('scope')) {
            $query->where('scope', $request->scope);
        }

        return $this->success($query->get(), 'System fields fetched successfully');
    }

    /**
     * Toggle a system field's active state.
     */
    public function toggle($id): JsonResponse
    {
        $field = SystemField::findOrFail($id);
        $field->is_active = ! $field->is_active;
        $field->save();

        return $this->success($field, 'System field updated successfully');
    }

    /**
     * Public alias => bool visibility map for a scope (consumed by portal/admission).
     */
    public function publicMap(Request $request): JsonResponse
    {
        $scope = $request->get('scope', 'student');
        $map = SystemField::where('scope', $scope)->pluck('is_active', 'alias');
        return $this->success($map, 'System fields fetched successfully');
    }
}
