<?php

namespace App\Http\Controllers\Api\v1\LessonPlan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LessonPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LessonPlanController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'staff_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        // Use DB::table to bypass the ScopesByAcademicSession global scope on the ClassTimetable model
        $timetables = DB::table('class_timetables')
            ->join('school_classes', 'class_timetables.school_class_id', '=', 'school_classes.id')
            ->join('sections', 'class_timetables.section_id', '=', 'sections.id')
            ->join('subjects', 'class_timetables.subject_id', '=', 'subjects.id')
            ->where('class_timetables.staff_id', $request->staff_id)
            ->select(
                'class_timetables.id',
                'class_timetables.day',
                'class_timetables.start_time',
                'class_timetables.end_time',
                'class_timetables.room',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'school_classes.name as class_name',
                'sections.name as section_name'
            )
            ->get()
            ->groupBy('day');

        // Get all lesson plans for the teacher's timetables in this date range
        $allTimetableIds = collect();
        foreach ($timetables as $dayTts) {
            $allTimetableIds = $allTimetableIds->merge($dayTts->pluck('id'));
        }
        $lessonPlans = LessonPlan::whereIn('class_timetable_id', $allTimetableIds->unique())
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->groupBy(function ($plan) {
                return $plan->date . '|' . $plan->class_timetable_id;
            });

        // Construct the weekly plan
        $weeklyPlan = [];
        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $day = $currentDate->format('l');
            $dateStr = $currentDate->format('Y-m-d');
            $dayTts = $timetables->get($day, collect());

            $dayLessons = $dayTts->map(function ($tt) use ($dateStr, $lessonPlans) {
                $plan = $lessonPlans->get($dateStr . '|' . $tt->id)?->first();

                return [
                    'id' => (string) $tt->id,
                    'subject' => $tt->subject_name,
                    'subjectCode' => $tt->subject_code ?? '',
                    'className' => $tt->class_name . '(' . $tt->section_name . ')',
                    'timeRange' => $tt->start_time . ' - ' . $tt->end_time,
                    'roomNo' => $tt->room ?? '',
                    'plan' => $plan ? [
                        'id' => (string) $plan->id,
                        'lesson' => $plan->lesson,
                        'topic' => $plan->topic,
                        'sub_topic' => $plan->sub_topic,
                        'presentation' => $plan->presentation,
                        'objectives' => $plan->objectives,
                        'is_completed' => true
                    ] : null,
                    'actions' => $plan ? ["report", "edit", "view", "add"] : ["add"]
                ];
            });

            $weeklyPlan[] = [
                'day' => $day,
                'date' => $currentDate->format('Y-m-d'),
                'lessons' => array_values($dayLessons->toArray())
            ];

            $currentDate->addDay();
        }

        return response()->json($weeklyPlan);
    }

    public function store(Request $request)
    {
        $request->validate([
            'class_timetable_id' => 'required|exists:class_timetables,id',
            'date' => 'required|date',
            'lesson' => 'required|string',
            'topic' => 'required|string',
            'sub_topic' => 'nullable|string',
        ]);

        $lessonPlan = LessonPlan::updateOrCreate(
            [
                'class_timetable_id' => $request->class_timetable_id,
                'date' => Carbon::parse($request->date)->format('Y-m-d')
            ],
            $request->all()
        );

        return response()->json(['message' => 'Lesson plan saved successfully', 'data' => $lessonPlan]);
    }

    public function show($id)
    {
        $lessonPlan = LessonPlan::with('classTimetable')->findOrFail($id);
        return response()->json($lessonPlan);
    }

    public function update(Request $request, $id)
    {
        $lessonPlan = LessonPlan::findOrFail($id);
        $lessonPlan->update($request->all());
        return response()->json(['message' => 'Lesson plan updated successfully', 'data' => $lessonPlan]);
    }

    public function destroy($id)
    {
        LessonPlan::findOrFail($id)->delete();
        return response()->json(['message' => 'Lesson plan deleted successfully']);
    }
}
