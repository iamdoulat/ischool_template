<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSchedule;
use Illuminate\Http\Request;

class ExamMarkController extends Controller
{
    public function index(Request $request, $examId)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
        ]);

        $exam = Exam::with('students')->findOrFail($examId);
        $subjectId = $request->subject_id;

        // Fetch existing marks for this exam and subject
        $results = ExamResult::where('exam_id', $examId)
            ->where('subject_id', $subjectId)
            ->get()
            ->keyBy('student_id');

        $studentsData = $exam->students->map(function ($student) use ($results) {
            $result = $results->get($student->id);
            return [
                'id' => $student->id,
                'admission_no' => $student->admission_no,
                'name' => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'theory_marks' => $result ? $result->theory_marks : null,
                'practical_marks' => $result ? $result->practical_marks : null,
                'is_absent' => $result ? $result->is_absent : false,
            ];
        });

        return response()->json([
            'data' => $studentsData
        ]);
    }

    public function store(Request $request, $examId)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'marks' => 'array',
            'marks.*.student_id' => 'required|exists:users,id',
            'marks.*.theory_marks' => 'nullable|numeric',
            'marks.*.practical_marks' => 'nullable|numeric',
            'marks.*.is_absent' => 'boolean',
        ]);

        $subjectId = $request->subject_id;
        $marksData = $request->marks ?? [];

        foreach ($marksData as $mark) {
            $totalMarks = 0;
            if (isset($mark['theory_marks'])) {
                $totalMarks += (float) $mark['theory_marks'];
            }
            if (isset($mark['practical_marks'])) {
                $totalMarks += (float) $mark['practical_marks'];
            }

            ExamResult::updateOrCreate(
                ['exam_id' => $examId, 'student_id' => $mark['student_id'], 'subject_id' => $subjectId],
                [
                    'theory_marks' => $mark['theory_marks'] ?? null,
                    'practical_marks' => $mark['practical_marks'] ?? null,
                    'marks' => $totalMarks > 0 ? $totalMarks : null,
                    'is_absent' => $mark['is_absent'] ?? false,
                ]
            );
        }

        return response()->json(['message' => 'Exam marks saved successfully']);
    }
}
