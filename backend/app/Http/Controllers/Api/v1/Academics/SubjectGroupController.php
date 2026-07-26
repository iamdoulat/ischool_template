<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Controller;
use App\Models\SubjectGroup;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Api\BaseController;

class SubjectGroupController extends BaseController
{
    public function index(Request $request)
    {
        $query = SubjectGroup::with(['schoolClass', 'sections', 'subjects']);

        if ($request->has('school_class_id') && $request->school_class_id) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->has('section_id') && $request->section_id) {
            $query->whereHas('sections', function ($q) use ($request) {
                $q->where('sections.id', $request->section_id);
            });
        }

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhereHas('schoolClass', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
        }

        if ($request->has('no_paginate') && $request->no_paginate == 'true') {
            $subjectGroups = $query->orderBy('name', 'asc')->get();
        } else {
            $perPage = $request->get('limit', 10);
            $subjectGroups = $query->orderBy('name', 'asc')->paginate($perPage);
        }

        return $this->success($subjectGroups, 'Subject Groups retrieved successfully');
    }

    public function store(Request $request)
    {
        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subject_groups', 'name')
                    ->where(fn($q) => $q->where('school_class_id', $request->school_class_id)
                        ->where('academic_session_id', $activeSessionId))
            ],
            'school_class_id' => 'required|exists:school_classes,id',
            'description' => 'nullable|string',
            'sections' => 'required|array|min:1',
            'sections.*' => 'required|exists:sections,id',
            'subjects' => 'required|array|min:1',
            'subjects.*' => 'required|exists:subjects,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors());
        }

        $subjectGroup = SubjectGroup::create([
            'name' => $request->name,
            'school_class_id' => $request->school_class_id,
            'description' => $request->description,
            'academic_session_id' => $activeSessionId,
        ]);

        // Sync relationships
        $subjectGroup->sections()->sync($request->sections);
        $subjectGroup->subjects()->sync($request->subjects);

        return $this->success($subjectGroup->load(['schoolClass', 'sections', 'subjects']), 'Subject Group created successfully', 201);
    }

    public function show($id)
    {
        $subjectGroup = SubjectGroup::findOrFail($id);
        return $this->success($subjectGroup->load(['schoolClass', 'sections', 'subjects']));
    }

    public function update(Request $request, $id)
    {
        $subjectGroup = SubjectGroup::findOrFail($id);
        $activeSessionId = $subjectGroup->academic_session_id ?? AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subject_groups', 'name')
                    ->where(fn($q) => $q->where('school_class_id', $request->school_class_id)
                        ->where('academic_session_id', $activeSessionId))
                    ->ignore($subjectGroup->id)
            ],
            'school_class_id' => 'required|exists:school_classes,id',
            'description' => 'nullable|string',
            'sections' => 'required|array|min:1',
            'sections.*' => 'required|exists:sections,id',
            'subjects' => 'required|array|min:1',
            'subjects.*' => 'required|exists:subjects,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors());
        }

        $subjectGroup->update([
            'name' => $request->name,
            'school_class_id' => $request->school_class_id,
            'description' => $request->description,
        ]);

        // Sync relationships
        $subjectGroup->sections()->sync($request->sections);
        $subjectGroup->subjects()->sync($request->subjects);

        return $this->success($subjectGroup->fresh(['schoolClass', 'sections', 'subjects']), 'Subject Group updated successfully');
    }

    public function destroy($id)
    {
        $subjectGroup = SubjectGroup::findOrFail($id);
        $subjectGroup->delete();

        return $this->success(null, 'Subject Group deleted successfully');
    }
}
