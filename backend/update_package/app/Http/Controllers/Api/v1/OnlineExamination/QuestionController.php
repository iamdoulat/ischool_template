<?php

namespace App\Http\Controllers\Api\v1\OnlineExamination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Question;
use Illuminate\Support\Facades\Auth;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $query = Question::with('creator');

        if ($request->has('search')) {
            $query->where('question', 'like', '%' . $request->search . '%');
        }

        if ($request->has('class_name')) {
            $query->where('class_name', $request->class_name);
        }

        if ($request->has('section')) {
            $query->where('section', $request->section);
        }

        if ($request->has('subject')) {
            $query->where('subject', $request->subject);
        }

        if ($request->has('question_type')) {
            $query->where('question_type', $request->question_type);
        }

        if ($request->has('level')) {
            $query->where('level', $request->level);
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject' => 'required|string',
            'question_type' => 'required|string',
            'level' => 'required|string',
            'question' => 'required|string',
            'options' => 'nullable|array',
            'correct_answer' => 'nullable|string'
        ]);

        $data = $request->all();
        $data['created_by'] = Auth::id();

        $question = Question::create($data);
        return response()->json(['message' => 'Question created successfully', 'data' => $question]);
    }

    public function show($id)
    {
        return response()->json(Question::with('creator')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject' => 'required|string',
            'question_type' => 'required|string',
            'level' => 'required|string',
            'question' => 'required|string',
            'options' => 'nullable|array',
            'correct_answer' => 'nullable|string'
        ]);

        $question = Question::findOrFail($id);
        $question->update($request->all());
        return response()->json(['message' => 'Question updated successfully', 'data' => $question]);
    }

    public function destroy($id)
    {
        Question::findOrFail($id)->delete();
        return response()->json(['message' => 'Question deleted successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        Question::whereIn('id', $request->ids)->delete();
        return response()->json(['message' => 'Questions deleted successfully']);
    }
    public function bulkImport(Request $request)
    {
        $request->validate([
            'questions' => 'required|array',
            'questions.*.class_name' => 'required|string',
            'questions.*.section' => 'required|string',
            'questions.*.subject' => 'required|string',
            'questions.*.question_type' => 'required|string',
            'questions.*.level' => 'required|string',
            'questions.*.question' => 'required|string',
            'questions.*.options' => 'nullable|array',
            'questions.*.correct_answer' => 'nullable|string'
        ]);

        $userId = Auth::id();
        $questions = [];

        foreach ($request->questions as $q) {
            $q['created_by'] = $userId;
            $questions[] = $q;
        }

        // We can do a loop with create to trigger events or a bulk insert.
        // Doing a loop with Question::create for simplicity and model events if any.
        foreach ($questions as $data) {
            Question::create($data);
        }

        return response()->json(['message' => 'Questions imported successfully']);
    }
}
