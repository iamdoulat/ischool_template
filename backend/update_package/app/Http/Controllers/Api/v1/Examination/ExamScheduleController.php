<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExamGroup;
use App\Models\ExamSchedule;

class ExamScheduleController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exam_groups' => ExamGroup::with('exams')->get()
        ]);
    }

    public function getAllSchedules()
    {
        $schedules = ExamSchedule::with(['exam', 'subject'])
            ->get()
            ->groupBy('exam_id');

        return response()->json($schedules);
    }

    public function searchSchedule(Request $request)
    {
        $request->validate([
            'exam_id' => 'required',
        ]);

        $schedule = ExamSchedule::where('exam_id', $request->exam_id)
            ->with('subject')
            ->get();

        return response()->json($schedule);
    }

    public function store(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'schedules' => 'array',
            'schedules.*.subject_id' => 'required|exists:subjects,id',
            'schedules.*.date_from' => 'nullable|date',
            'schedules.*.start_time' => 'nullable|string',
            'schedules.*.duration' => 'nullable|string',
            'schedules.*.room_no' => 'nullable|string',
            'schedules.*.max_marks' => 'nullable|numeric',
            'schedules.*.min_marks' => 'nullable|numeric',
        ]);

        $examId = $request->exam_id;
        $schedulesData = $request->schedules ?? [];

        // Keep track of which subject IDs are submitted to delete the rest
        $submittedSubjectIds = collect($schedulesData)->pluck('subject_id')->toArray();
        ExamSchedule::where('exam_id', $examId)->whereNotIn('subject_id', $submittedSubjectIds)->delete();

        foreach ($schedulesData as $scheduleData) {
            ExamSchedule::updateOrCreate(
                ['exam_id' => $examId, 'subject_id' => $scheduleData['subject_id']],
                [
                    'date_from' => $scheduleData['date_from'] ?? null,
                    'start_time' => $scheduleData['start_time'] ?? null,
                    'duration' => $scheduleData['duration'] ?? null,
                    'room_no' => $scheduleData['room_no'] ?? null,
                    'max_marks' => $scheduleData['max_marks'] ?? null,
                    'min_marks' => $scheduleData['min_marks'] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Exam subjects saved successfully']);
    }
}
