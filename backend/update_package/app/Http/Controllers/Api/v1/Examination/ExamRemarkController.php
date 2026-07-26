<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamResult;
use Illuminate\Http\Request;

class ExamRemarkController extends Controller
{
    public function index($examId)
    {
        $exam = Exam::with('students')->findOrFail($examId);

        // Fetch remarks (note column) from exam results. 
        // We can just grab the first subject's note or we can group by student.
        // Assuming remark is general per exam per student, but stored in exam_results.
        // Let's get the distinct notes per student for this exam.
        $results = ExamResult::where('exam_id', $examId)
            ->whereNotNull('note')
            ->where('note', '!=', '')
            ->get()
            ->keyBy('student_id');

        $studentsData = $exam->students->map(function ($student) use ($results) {
            $result = $results->get($student->id);
            return [
                'id' => $student->id,
                'admission_no' => $student->admission_no,
                'name' => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'note' => $result ? $result->note : '',
            ];
        });

        return response()->json([
            'data' => $studentsData
        ]);
    }

    public function store(Request $request, $examId)
    {
        $request->validate([
            'remarks' => 'array',
            'remarks.*.student_id' => 'required|exists:users,id',
            'remarks.*.note' => 'nullable|string',
        ]);

        $remarksData = $request->remarks ?? [];

        foreach ($remarksData as $remark) {
            // Update the note for all subjects for this student in this exam
            ExamResult::where('exam_id', $examId)
                ->where('student_id', $remark['student_id'])
                ->update(['note' => $remark['note']]);
        }

        return response()->json(['message' => 'Teacher remarks saved successfully']);
    }
}
