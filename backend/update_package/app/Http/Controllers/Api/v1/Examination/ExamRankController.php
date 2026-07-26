<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamRank;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamRankController extends Controller
{
    public function generate(Request $request, $examId)
    {
        $exam = Exam::with('students')->findOrFail($examId);
        
        // Sum marks for each student in this exam
        $studentMarks = ExamResult::where('exam_id', $examId)
            ->select('student_id', DB::raw('SUM(marks) as total_marks'))
            ->groupBy('student_id')
            ->get();

        // If a student is assigned to the exam but has no marks yet, total_marks is 0.
        // Let's build a collection of all assigned students
        $totals = [];
        foreach ($exam->students as $student) {
            $record = $studentMarks->where('student_id', $student->id)->first();
            $totals[] = [
                'student_id' => $student->id,
                'total_marks' => $record ? (float) $record->total_marks : 0,
            ];
        }

        // Sort descending by total_marks
        usort($totals, function ($a, $b) {
            return $b['total_marks'] <=> $a['total_marks'];
        });

        // Assign rank (handling ties)
        $rank = 1;
        $prevMarks = null;
        $actualRank = 1;

        DB::beginTransaction();
        try {
            // Clear old ranks for this exam
            ExamRank::where('exam_id', $examId)->delete();

            foreach ($totals as $index => $data) {
                if ($prevMarks !== null && $data['total_marks'] < $prevMarks) {
                    $rank = $actualRank;
                }

                ExamRank::create([
                    'exam_id' => $examId,
                    'student_id' => $data['student_id'],
                    'rank' => $rank,
                    'total_marks' => $data['total_marks'],
                ]);

                $prevMarks = $data['total_marks'];
                $actualRank++;
            }
            DB::commit();

            return response()->json(['message' => 'Ranks generated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate ranks', 'error' => $e->getMessage()], 500);
        }
    }
}
