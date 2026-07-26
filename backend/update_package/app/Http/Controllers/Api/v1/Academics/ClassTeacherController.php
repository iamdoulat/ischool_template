<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Api\BaseController;
use App\Models\ClassTeacher;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClassTeacherController extends BaseController
{
    /**
     * List all class teacher assignments grouped by class and section.
     */
    public function index(Request $request): JsonResponse
    {
        $assignments = ClassTeacher::with(['schoolClass', 'section', 'staff'])
            ->get()
            ->groupBy(function ($item) {
                return $item->school_class_id . '-' . $item->section_id;
            });

        $formatted = [];
        foreach ($assignments as $key => $items) {
            $first = $items->first();
            $formatted[] = [
                'id' => $key,
                'class_id' => $first->school_class_id,
                'section_id' => $first->section_id,
                'class_name' => $first->schoolClass->name ?? '',
                'section_name' => $first->section->name ?? '',
                'teachers' => $items->map(function ($item) {
                    return [
                        'id' => $item->staff_id,
                        'name' => ($item->staff->name ?? '') . ' (' . ($item->staff->staff_id ?? '') . ')',
                    ];
                }),
            ];
        }

        return $this->success($formatted, 'Class teacher assignments retrieved successfully');
    }

    /**
     * Store assignments for a class and section.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'teacher_ids' => 'required|array',
            'teacher_ids.*' => 'exists:users,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
        ]);

        DB::beginTransaction();
        try {
            // Remove existing assignments for this class/section
            ClassTeacher::where('school_class_id', $request->school_class_id)
                ->where('section_id', $request->section_id)
                ->delete();

            // Insert new assignments
            foreach ($request->teacher_ids as $staffId) {
                ClassTeacher::create([
                    'school_class_id' => $request->school_class_id,
                    'section_id' => $request->section_id,
                    'staff_id' => $staffId,
                    'academic_session_id' => $request->academic_session_id,
                ]);
            }

            DB::commit();
            return $this->success(null, 'Class teachers assigned successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to assign class teachers: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove an assignment group.
     */
    public function destroy($key): JsonResponse
    {
        $parts = explode('-', $key);
        if (count($parts) !== 2) {
            return $this->error('Invalid assignment key', 400);
        }

        ClassTeacher::where('school_class_id', $parts[0])
            ->where('section_id', $parts[1])
            ->delete();

        return $this->success(null, 'Class teacher assignment removed successfully');
    }

    /**
     * Remove multiple assignment groups.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $request->validate([
            'keys' => 'required|array',
            'keys.*' => 'string'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->keys as $key) {
                $parts = explode('-', $key);
                if (count($parts) === 2) {
                    ClassTeacher::where('school_class_id', $parts[0])
                        ->where('section_id', $parts[1])
                        ->delete();
                }
            }
            DB::commit();
            return $this->success(null, 'Assignments removed successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to remove assignments: ' . $e->getMessage(), 500);
        }
    }
}
