<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\Request;

class ExamStudentController extends Controller
{
    public function index($examId)
    {
        $exam = Exam::with('students')->findOrFail($examId);
        return response()->json([
            'data' => $exam->students->pluck('id')
        ]);
    }

    public function store(Request $request, $examId)
    {
        $request->validate([
            'student_ids' => 'array',
            'student_ids.*' => 'exists:users,id'
        ]);

        $exam = Exam::findOrFail($examId);
        
        $studentIds = $request->input('student_ids', []);
        
        // Sync the students (this will attach the new ones and detach the old ones)
        $exam->students()->sync($studentIds);

        return response()->json([
            'message' => 'Students assigned to exam successfully'
        ]);
    }
}
