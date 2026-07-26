<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Api\BaseController;
use App\Models\Subject;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SubjectController extends BaseController
{
    public function index(Request $request)
    {
        $query = Subject::query();

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('no_paginate') && $request->no_paginate == 'true') {
            $subjects = $query->orderBy('name', 'asc')->get();
        } else {
            $perPage = $request->get('limit', 10);
            $subjects = $query->orderBy('name', 'asc')->paginate($perPage);
        }

        return $this->success($subjects, 'Subjects retrieved successfully');
    }

    public function store(Request $request)
    {
        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subjects', 'name')
                    ->where(fn($q) => $q->where('academic_session_id', $activeSessionId))
            ],
            'code' => 'nullable|string|max:50',
            'type' => 'required|in:theory,practical',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors());
        }

        $subject = Subject::create([
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type,
            'academic_session_id' => $activeSessionId,
        ]);

        return $this->success($subject, 'Subject created successfully', 201);
    }

    public function show(Subject $subject)
    {
        return $this->success($subject, 'Subject retrieved successfully');
    }

    public function update(Request $request, Subject $subject)
    {
        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subjects', 'name')
                    ->where(fn($q) => $q->where('academic_session_id', $activeSessionId))
                    ->ignore($subject->id)
            ],
            'code' => 'nullable|string|max:50',
            'type' => 'required|in:theory,practical',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors());
        }

        $subject->update([
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type,
            'academic_session_id' => $subject->academic_session_id ?? $activeSessionId,
        ]);

        return $this->success($subject->fresh(), 'Subject updated successfully');
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();

        return $this->success(null, 'Subject deleted successfully');
    }
}
