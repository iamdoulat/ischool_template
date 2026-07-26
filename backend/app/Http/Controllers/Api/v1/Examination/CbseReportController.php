<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Exam;
use App\Models\User;
use App\Models\ExamResult;
use App\Models\Subject;
use App\Models\Classes;
use App\Models\Section;
use App\Models\CbseTemplate;

class CbseReportController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exams' => Exam::all(),
            'classes' => Classes::all(),
            'sections' => Section::all(),
            'templates' => CbseTemplate::all(),
        ]);
    }

    public function searchStudents(Request $request)
    {
        $query = User::role('Student');

        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->section_id) {
            $query->where('section_id', $request->section_id);
        }

        return response()->json($query->get());
    }

    public function getSubjectMarksReport(Request $request)
    {
        $request->validate([
            'exam_id' => 'required',
        ]);

        $exam = Exam::findOrFail($request->exam_id);

        $students = User::where('role', 'student')
            ->with(['examResults' => function ($query) use ($request) {
                $query->where('exam_id', $request->exam_id)->with('subject');
            }])
            ->get();

        // Get unique subjects found in this exam for these students
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
