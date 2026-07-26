<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExamGroup;
use App\Models\Exam;
use App\Models\User;
use App\Models\ExamResult;
use App\Models\Subject;

class ExamResultController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exam_groups' => ExamGroup::with('exams')->get(),
            'sessions' => \App\Models\AcademicSession::all(),
        ]);
    }

    public function searchResults(Request $request)
    {
        $request->validate([
            'exam_id' => 'required',
            'school_class_id' => 'required',
            'section_id' => 'required',
        ]);

        $students = User::where('role', 'student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->with(['examResults' => function ($query) use ($request) {
                $query->where('exam_id', $request->exam_id)->with('subject');
            }])
            ->get();

        // Get unique subjects found in this exam for these students to build headers
        $subjectIds = ExamResult::where('exam_id', $request->exam_id)
            ->whereIn('student_id', $students->pluck('id'))
            ->distinct()
            ->pluck('subject_id');
        
        $subjects = Subject::whereIn('id', $subjectIds)->get();

        return response()->json([
            'students' => $students,
            'subjects' => $subjects
        ]);
    }
}
