<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\StudentHouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentHouseController extends BaseController
{
    /**
     * Display a listing of the student houses.
     */
    public function index(): JsonResponse
    {
        $houses = StudentHouse::latest()->get();
        return $this->success($houses, 'Student houses retrieved successfully');
    }

    /**
     * Store a newly created student house.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:student_houses',
            'description' => 'nullable|string',
        ]);

        $house = StudentHouse::create($validated);
        return $this->success($house, 'Student house created successfully', 201);
    }

    /**
     * Update the specified student house.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $house = StudentHouse::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:student_houses,name,' . $id,
            'description' => 'nullable|string',
        ]);

        $house->update($validated);
        return $this->success($house, 'Student house updated successfully');
    }

    /**
     * Remove the specified student house.
     */
    public function destroy($id): JsonResponse
    {
        $house = StudentHouse::findOrFail($id);
        $house->delete();
        return $this->success(null, 'Student house deleted successfully');
    }

    /**
     * Bulk delete student houses.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:student_houses,id',
        ]);

        StudentHouse::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected houses deleted successfully');
    }
}
