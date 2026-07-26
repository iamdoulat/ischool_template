<?php

namespace App\Http\Controllers\Api\v1\Homework;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class HomeworkController extends Controller
{
    public function index(Request $request)
    {
        $homeworks = Homework::with(['schoolClass', 'section', 'subjectGroup', 'subject', 'creator'])
            ->when($request->class_id, function ($query, $classId) {
                $query->where('class_id', $classId);
            })
            ->when($request->section_id, function ($query, $sectionId) {
                $query->where('section_id', $sectionId);
            })
            ->when($request->subject_group_id, function ($query, $groupId) {
                $query->where('subject_group_id', $groupId);
            })
            ->when($request->subject_id, function ($query, $subjectId) {
                $query->where('subject_id', $subjectId);
            })
            ->when($request->search, function ($query, $search) {
                $query->where('description', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($homeworks);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'homework_date' => 'required|date',
            'submission_date' => 'required|date',
            'max_marks' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'class_id',
            'section_id',
            'subject_group_id',
            'subject_id',
            'title',
            'homework_date',
            'submission_date',
            'evaluation_date',
            'max_marks',
            'description',
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/homeworks', $filename, 'public');
            $data['attachment'] = '/storage/' . $path;
        }

        $data['created_by'] = Auth::id();

        $homework = Homework::create($data);
        $homework->load(['schoolClass', 'section', 'subject']);

        NotificationDispatcher::dispatch('Homework Created', [
            'subject' => $homework->subject?->name ?? '',
            'class' => $homework->schoolClass?->name ?? '',
            'section' => $homework->section?->name ?? '',
            'homework_date' => $homework->homework_date ?? '',
            'submission_date' => $homework->submission_date ?? '',
            'description' => $homework->description ?? '',
        ], [
            'student_id' => null,
        ]);

        return response()->json([
            'message' => 'Homework created successfully',
            'data' => $homework
        ], 201);
    }

    public function show(Homework $homework)
    {
        return response()->json($homework->load(['schoolClass', 'section', 'subjectGroup', 'subject', 'creator']));
    }

    public function update(Request $request, Homework $homework)
    {
        $validator = Validator::make($request->all(), [
            'homework_date' => 'required|date',
            'submission_date' => 'required|date',
            'max_marks' => 'nullable|numeric|min:0',
            'title' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'class_id',
            'section_id',
            'subject_group_id',
            'subject_id',
            'title',
            'homework_date',
            'submission_date',
            'evaluation_date',
            'max_marks',
            'description',
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/homeworks', $filename, 'public');
            $data['attachment'] = '/storage/' . $path;
        }

        $homework->update($data);

        return response()->json([
            'message' => 'Homework updated successfully',
            'data' => $homework
        ]);
    }

    public function destroy(Homework $homework)
    {
        $homework->delete();

        return response()->json([
            'message' => 'Homework deleted successfully'
        ]);
    }
}
