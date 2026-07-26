<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use App\Models\Exam;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with(['examGroup', 'marksheetTemplate']);

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('unlinked') && $request->unlinked === 'true') {
            $query->whereNull('exam_group_id');
        }

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'exam_group_id' => 'required|exists:exam_groups,id',
            'marksheet_template_id' => 'nullable|exists:marksheet_templates,id',
            'session' => 'nullable|string|max:255',
            'is_published' => 'nullable|boolean',
            'is_result_published' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        $exam = Exam::create($request->only(['name', 'exam_group_id', 'marksheet_template_id', 'session', 'is_published', 'is_result_published', 'description']));
        return response()->json(['message' => 'Exam created successfully', 'data' => $exam->load('marksheetTemplate')], 201);
    }

    public function show($id)
    {
        return response()->json(Exam::with(['examGroup', 'marksheetTemplate'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);
        $wasResultPublished = $exam->is_result_published;
        $exam->update($request->only(['name', 'exam_group_id', 'marksheet_template_id', 'session', 'is_published', 'is_result_published', 'description']));

        if ($exam->is_result_published && !$wasResultPublished) {
            $exam->load('examGroup');
            NotificationDispatcher::dispatch('Exam Result Published', [
                'student_name' => '',
                'roll_no' => '',
                'exam' => $exam->name ?? '',
                'class' => '',
                'section' => '',
            ], [
                'student_id' => null,
            ]);
        }

        return response()->json(['message' => 'Exam updated successfully', 'data' => $exam]);
    }

    public function destroy($id)
    {
        Exam::findOrFail($id)->delete();
        return response()->json(['message' => 'Exam deleted successfully']);
    }

    public function link(Request $request)
    {
        $request->validate([
            'exam_group_id' => 'required|exists:exam_groups,id',
            'exam_ids' => 'required|array|min:1',
            'exam_ids.*' => 'exists:exams,id',
        ]);

        Exam::whereIn('id', $request->exam_ids)
            ->update(['exam_group_id' => $request->exam_group_id]);

        return response()->json(['message' => count($request->exam_ids) . ' exam(s) linked successfully']);
    }
}
