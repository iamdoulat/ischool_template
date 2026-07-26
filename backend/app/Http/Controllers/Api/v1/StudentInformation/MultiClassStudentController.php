<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\MultiClassStudent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultiClassStudentController extends BaseController
{
    /**
     * List students with multiple class enrollments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MultiClassStudent::with(['student.studentCategory', 'schoolClass', 'section']);

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_no', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $records = $query->latest()->paginate($request->get('limit', 50));

        return $this->success($records, 'Multi-class students retrieved successfully');
    }

    /**
     * Assign a student to an additional class/section.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
        ]);

        // Check if the student is already enrolled in this class/section (main or multi)
        $isAlreadyInMain = User::where('id', $validated['user_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('section_id', $validated['section_id'])
            ->exists();

        $isAlreadyInMulti = MultiClassStudent::where('user_id', $validated['user_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('section_id', $validated['section_id'])
            ->exists();

        if ($isAlreadyInMain || $isAlreadyInMulti) {
            return $this->error('Student is already enrolled in this class and section.', 400);
        }

        $multiClassStudent = MultiClassStudent::create($validated);

        return $this->success($multiClassStudent, 'Student assigned to additional class successfully', 201);
    }

    /**
     * Remove a multi-class enrollment.
     */
    public function destroy($id): JsonResponse
    {
        $multiClassStudent = MultiClassStudent::findOrFail($id);
        $multiClassStudent->delete();

        return $this->success(null, 'Additional class enrollment removed successfully');
    }
}
