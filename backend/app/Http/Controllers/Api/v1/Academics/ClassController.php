<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Api\BaseController;

class ClassController extends BaseController
{
    public function index(Request $request)
    {
        $query = SchoolClass::with('sections');

        if ($request->has('all_sessions') && $request->all_sessions == 'true') {
            $query->withoutGlobalScope('academic_session');
        }

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('no_paginate') && $request->no_paginate == 'true') {
            $classes = $query->orderBy('name', 'asc')->get();
        } else {
            $perPage = $request->get('limit', 10);
            $classes = $query->orderBy('name', 'asc')->paginate($perPage);
        }

        return $this->success($classes, 'Classes retrieved successfully');
    }

    public function store(Request $request)
    {
        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_classes', 'name')
                    ->where(fn($q) => $q->where('academic_session_id', $activeSessionId))
            ],
            // sections is now an array of label strings e.g. ["A","B","C","D"]
            'sections' => 'required|array|min:1',
            'sections.*' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request, $activeSessionId) {
            $class = SchoolClass::create([
                'name' => $request->name,
                'academic_session_id' => $activeSessionId,
            ]);

            // Create individual section rows for this class
            foreach ($request->sections as $sectionName) {
                Section::create([
                    'name' => trim($sectionName),
                    'school_class_id' => $class->id,
                    'academic_session_id' => $activeSessionId,
                ]);
            }

            return $this->success($class->load('sections'), 'Class created successfully', 201);
        });
    }

    public function show(SchoolClass $class)
    {
        return $this->success($class->load('sections'), 'Class retrieved successfully');
    }

    public function update(Request $request, SchoolClass $class)
    {
        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_classes', 'name')
                    ->where(fn($q) => $q->where('academic_session_id', $activeSessionId))
                    ->ignore($class->id)
            ],
            'sections' => 'required|array|min:1',
            'sections.*' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request, $class, $activeSessionId) {
            $class->update([
                'name' => $request->name,
                'academic_session_id' => $class->academic_session_id ?? $activeSessionId,
            ]);

            // Delete old sections and recreate
            Section::where('school_class_id', $class->id)->delete();

            foreach ($request->sections as $sectionName) {
                Section::create([
                    'name' => trim($sectionName),
                    'school_class_id' => $class->id,
                    'academic_session_id' => $class->academic_session_id ?? $activeSessionId,
                ]);
            }

            return $this->success($class->fresh()->load('sections'), 'Class updated successfully');
        });
    }

    public function destroy(SchoolClass $class)
    {
        DB::transaction(function () use ($class) {
            // Delete owned sections first, then the class
            Section::where('school_class_id', $class->id)->delete();
            $class->delete();
        });

        return $this->success(null, 'Class deleted successfully');
    }
}
