<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamGroup;
use App\Models\ExamResult;
use App\Models\ExamSchedule;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExaminationReportController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exam_groups' => ExamGroup::all(),
            'sessions' => AcademicSession::all(),
            'classes' => SchoolClass::with('sections')->get(),
        ]);
    }

    public function getExamsByGroup($groupId)
    {
        return response()->json(Exam::where('exam_group_id', $groupId)->get());
    }

    public function getRankReport(Request $request)
    {
        $request->validate([
            'exam_id' => 'required',
            'school_class_id' => 'required',
            'section_id' => 'required',
        ]);

        $examId = $request->exam_id;
        $classId = $request->school_class_id;
        $sectionId = $request->section_id;

        // Get subjects for this exam from schedules
        $subjects = ExamSchedule::where('exam_id', $examId)
            ->with('subject')
            ->get();

        if ($subjects->isEmpty()) {
            return response()->json(['data' => [], 'subjects' => []]);
        }

        // Get results for these students
        $results = ExamResult::where('exam_id', $examId)
            ->whereIn('student_id', function ($query) use ($classId, $sectionId) {
                $query->select('id')->from('users')
                    ->where('school_class_id', $classId);
                if ($sectionId !== 'all') {
                    $query->where('section_id', $sectionId);
                }
            })
            ->with('student')
            ->get();

        $studentData = [];
        foreach ($results as $res) {
            $studentId = $res->student_id;
            if (!isset($studentData[$studentId])) {
                $studentData[$studentId] = [
                    'student_id' => $studentId,
                    'admission_no' => $res->student->admission_no ?? '-',
                    'roll_no' => $res->student->roll_no ?? '-',
                    'student_name' => $res->student->name ?? '-',
                    'marks' => [],
                    'total_marks' => 0,
                    'max_total' => 0,
                    'is_pass' => true,
                ];
            }

            $marks = $res->marks;
            $studentData[$studentId]['marks'][$res->subject_id] = $marks;
            $studentData[$studentId]['total_marks'] += $marks;
            
            $sched = $subjects->firstWhere('subject_id', $res->subject_id);
            if ($sched) {
                $studentData[$studentId]['max_total'] += $sched->max_marks;
                if ($marks < $sched->min_marks) {
                    $studentData[$studentId]['is_pass'] = false;
                }
            }
        }

        // Calculate Percent and Rank
        $finalData = array_values($studentData);
        foreach ($finalData as &$student) {
            $student['percent'] = $student['max_total'] > 0 ? round(($student['total_marks'] / $student['max_total']) * 100, 2) : 0;
            $student['result'] = $student['is_pass'] ? 'Pass' : 'Fail';
        }

        // Sort by total marks for ranking
        usort($finalData, function ($a, $b) {
            return $b['total_marks'] <=> $a['total_marks'];
        });

        foreach ($finalData as $i => &$student) {
            $student['rank'] = $i + 1;
        }

        return response()->json([
            'data' => $finalData,
            'subjects' => $subjects->map(function ($s) {
                return [
                    'id' => $s->subject_id,
                    'name' => $s->subject->name,
                    'max_marks' => $s->max_marks,
                    'min_marks' => $s->min_marks,
                    'code' => $s->subject->code ?? ''
                ];
            })
        ]);
    }
}
