<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExamGroup;

class ExamGroupController extends Controller
{
    public function index(Request $request)
    {
        $query = ExamGroup::withCount('exams');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'exam_type' => 'required|string',
        ]);

        $group = ExamGroup::create($request->only(['name', 'exam_type', 'description']));
        return response()->json(['message' => 'Exam group created successfully', 'data' => $group]);
    }

    public function show($id)
    {
        $group = ExamGroup::with(['exams' => function ($query) {
            $query->withCount('examSchedules');
        }])->findOrFail($id);

        // Normalize to expected key name
        $group->exams->each(function ($exam) {
            $exam->subjects_count = $exam->exam_schedules_count ?? 0;
        });

        return response()->json($group);
    }

    public function update(Request $request, $id)
    {
        $group = ExamGroup::findOrFail($id);
        $group->update($request->only(['name', 'exam_type', 'description']));
        return response()->json(['message' => 'Exam group updated successfully', 'data' => $group]);
    }

    public function destroy($id)
    {
        ExamGroup::findOrFail($id)->delete();
        return response()->json(['message' => 'Exam group deleted successfully']);
    }
}
