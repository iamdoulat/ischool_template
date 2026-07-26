<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExamGroup;
use App\Models\Exam;
use App\Models\User;

class PublicExamResultController extends Controller
{
    public function getExamList()
    {
        $examGroups = ExamGroup::with(['exams' => function ($q) {
            $q->where('is_result_published', true);
        }])->get();

        return response()->json([
            'exam_groups' => $examGroups,
        ]);
    }

    public function searchByAdmission(Request $request)
    {
        $request->validate([
            'admission_no' => 'required|string',
            'exam_id' => 'required|exists:exams,id',
        ]);

        $student = User::where('role', 'student')
            ->where('admission_no', $request->admission_no)
            ->with(['examResults' => function ($query) use ($request) {
                $query->where('exam_id', $request->exam_id)->with('subject');
            }])
            ->first();

        if (!$student) {
            return response()->json([
                'found' => false,
                'message' => 'No student found with this admission number.',
            ]);
        }

        $results = $student->examResults;

        return response()->json([
            'found' => true,
            'student' => [
                'id' => $student->id,
                'admission_no' => $student->admission_no,
                'roll_no' => $student->roll_no,
                'name' => $student->name,
                'last_name' => $student->last_name,
                'class_name' => $student->schoolClass?->name,
                'section_name' => $student->section?->name,
            ],
            'exam_results' => $results->map(function ($r) {
                return [
                    'subject_name' => $r->subject?->name,
                    'marks' => $r->marks,
                    'theory_marks' => $r->theory_marks,
                    'practical_marks' => $r->practical_marks,
                    'is_absent' => $r->is_absent,
                ];
            }),
        ]);
    }
}
