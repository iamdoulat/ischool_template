<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\StudentCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentCategoryController extends BaseController
{
    /**
     * Display a listing of the student categories.
     */
    public function index(): JsonResponse
    {
        $categories = StudentCategory::latest()->get();
        return $this->success($categories, 'Student categories retrieved successfully');
    }

    /**
     * Store a newly created student category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255|unique:student_categories',
        ]);

        $category = StudentCategory::create($validated);
        return $this->success($category, 'Student category created successfully', 201);
    }

    /**
     * Update the specified student category.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $category = StudentCategory::findOrFail($id);

        $validated = $request->validate([
            'category_name' => 'required|string|max:255|unique:student_categories,category_name,' . $id,
        ]);

        $category->update($validated);
        return $this->success($category, 'Student category updated successfully');
    }

    /**
     * Remove the specified student category.
     */
    public function destroy($id): JsonResponse
    {
        $category = StudentCategory::findOrFail($id);
        $category->delete();
        return $this->success(null, 'Student category deleted successfully');
    }

    /**
     * Bulk delete student categories.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:student_categories,id',
        ]);

        StudentCategory::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected categories deleted successfully');
    }
}
