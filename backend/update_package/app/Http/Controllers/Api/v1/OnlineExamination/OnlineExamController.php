<?php

namespace App\Http\Controllers\Api\v1\OnlineExamination;

use App\Http\Controllers\Controller;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use App\Models\OnlineExam;

class OnlineExamController extends Controller
{
    public function index(Request $request)
    {
        $query = OnlineExam::withCount(['questions', 'questions as descriptive_questions_count' => function ($query) {
            $query->where('question_type', 'Descriptive');
        }]);

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status')) {
            $now = now();
            if ($request->status === 'upcoming') {
                $query->where('exam_to', '>=', $now);
            } elseif ($request->status === 'closed') {
                $query->where('exam_to', '<', $now);
            }
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'is_quiz' => 'required|boolean',
            'exam_from' => 'required|date',
            'exam_to' => 'required|date|after_or_equal:exam_from',
            'duration' => 'required|string',
            'attempt' => 'required|integer',
            'passing_percentage' => 'required|integer',
            'is_published' => 'required|boolean',
            'is_result_published' => 'required|boolean',
            'description' => 'nullable|string'
        ]);

        $onlineExam = OnlineExam::create($request->all());
        
        if ($request->has('questions')) {
            $syncData = [];
            foreach ($request->questions as $q) {
                if (isset($q['id'])) {
                    $syncData[$q['id']] = ['marks' => $q['marks'] ?? 1];
                }
            }
            $onlineExam->questions()->sync($syncData);
        }

        return response()->json(['message' => 'Online exam created successfully', 'data' => $onlineExam->load('questions')]);
    }

    public function show($id)
    {
        return response()->json(OnlineExam::with('questions')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string',
            'is_quiz' => 'required|boolean',
            'exam_from' => 'required|date',
            'exam_to' => 'required|date|after_or_equal:exam_from',
            'duration' => 'required|string',
            'attempt' => 'required|integer',
            'passing_percentage' => 'required|integer',
            'is_published' => 'required|boolean',
            'is_result_published' => 'required|boolean',
            'description' => 'nullable|string'
        ]);

        $onlineExam = OnlineExam::findOrFail($id);
        $original = $onlineExam->getOriginal();
        $onlineExam->update($request->all());

        if ($request->has('questions')) {
            $syncData = [];
            foreach ($request->questions as $q) {
                if (isset($q['id'])) {
                    $syncData[$q['id']] = ['marks' => $q['marks'] ?? 1];
                }
            }
            $onlineExam->questions()->sync($syncData);
        }

        $wasPublished = $original['is_published'] ?? false;
        $wasResultPublished = $original['is_result_published'] ?? false;
        $nowPublished = $onlineExam->is_published;
        $nowResultPublished = $onlineExam->is_result_published;

        if ($nowPublished && !$wasPublished) {
            NotificationDispatcher::dispatch('Online Examination Publish Exam', [
                'exam_title' => $onlineExam->title ?? '',
                'duration' => $onlineExam->duration ?? '',
                'total_marks' => $onlineExam->questions()->sum('marks') ?? '0',
                'exam_from' => $onlineExam->exam_from ?? '',
                'exam_to' => $onlineExam->exam_to ?? '',
            ], [
                'student_id' => null,
            ]);
        }

        if ($nowResultPublished && !$wasResultPublished) {
            NotificationDispatcher::dispatch('Online Examination Publish Result', [
                'exam_title' => $onlineExam->title ?? '',
            ], [
                'student_id' => null,
            ]);
        }

        return response()->json(['message' => 'Online exam updated successfully', 'data' => $onlineExam]);
    }

    public function destroy($id)
    {
        OnlineExam::findOrFail($id)->delete();
        return response()->json(['message' => 'Online exam deleted successfully']);
    }

    public function assignQuestions(Request $request, $id)
    {
        $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'required|exists:questions,id',
            'questions.*.marks' => 'required|integer'
        ]);

        $onlineExam = OnlineExam::findOrFail($id);
        
        $syncData = [];
        foreach ($request->questions as $q) {
            $syncData[$q['id']] = ['marks' => $q['marks']];
        }

        $onlineExam->questions()->sync($syncData);
        return response()->json(['message' => 'Questions assigned successfully']);
    }
}
