<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\CustomField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomFieldController extends BaseController
{
    /**
     * Categories supported by custom fields.
     */
    private array $categories = [
        'student' => 'Student',
        'staff' => 'Staff',
        'transfer_certificate' => 'Transfer Certificate',
    ];

    /**
     * Get custom fields grouped by the category they belong to.
     */
    public function index(): JsonResponse
    {
        $fields = CustomField::orderBy('id', 'asc')->get();

        $grouped = collect($this->categories)->map(function ($name, $id) use ($fields) {
            return [
                'id' => $id,
                'name' => $name,
                'fields' => $fields->where('belongs_to', $id)->values(),
            ];
        })->values();

        return $this->success($grouped, 'Custom fields fetched successfully');
    }

    /**
     * Store a new custom field.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateData($request);
        $field = CustomField::create($validated);

        return $this->success($field, 'Custom field created successfully', 201);
    }

    /**
     * Update an existing custom field.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $field = CustomField::findOrFail($id);
        $field->update($this->validateData($request));

        return $this->success($field, 'Custom field updated successfully');
    }

    /**
     * Delete a custom field.
     */
    public function destroy($id): JsonResponse
    {
        $field = CustomField::findOrFail($id);
        $field->delete();

        return $this->success(null, 'Custom field deleted successfully');
    }

    /**
     * Shared validation rules.
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'belongs_to' => 'required|in:student,staff,transfer_certificate',
            'field_type' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'grid' => 'nullable|integer|min:1|max:12',
            'field_values' => 'nullable|string',
            'is_required' => 'boolean',
            'visible_on_table' => 'boolean',
        ]);
    }
}
