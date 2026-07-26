<?php

namespace App\Http\Controllers\Api\v1\LessonPlan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lesson;

class LessonController extends Controller
{
    public function index()
    {
        $lessons = Lesson::all();

        // Group lessons by class/section/subject_group/subject for the UI
        $grouped = [];
        foreach ($lessons as $lesson) {
            $key = $lesson->class_name . '|' . $lesson->section . '|' . $lesson->subject_group . '|' . $lesson->subject;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'id' => $lesson->id,
                    'className' => $lesson->class_name,
                    'section' => $lesson->section,
                    'subjectGroup' => $lesson->subject_group,
                    'subject' => $lesson->subject,
                    'lessons' => [],
                    'lesson_ids' => []
                ];
            }
            $grouped[$key]['lessons'][] = $lesson->lesson;
            $grouped[$key]['lesson_ids'][] = $lesson->id;
        }

        return response()->json(array_values($grouped));
    }

    public function store(Request $request)
    {
        $request->validate([
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject_group' => 'required|string',
            'subject' => 'required|string',
            'lessons' => 'required|array'
        ]);

        $savedLessons = [];
        foreach ($request->lessons as $lessonName) {
            if (empty(trim($lessonName))) continue;
            
            $savedLessons[] = Lesson::create([
                'class_name' => $request->class_name,
                'section' => $request->section,
                'subject_group' => $request->subject_group,
                'subject' => $request->subject,
                'lesson' => $lessonName,
            ]);
        }

        return response()->json([
            'message' => 'Lessons created successfully',
            'data' => $savedLessons
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject_group' => 'required|string',
            'subject' => 'required|string',
            'lessons' => 'required|array'
        ]);

        $lesson = Lesson::findOrFail($id);

        // Delete all existing lessons for this group
        Lesson::where([
            'class_name' => $lesson->class_name,
            'section' => $lesson->section,
            'subject_group' => $lesson->subject_group,
            'subject' => $lesson->subject,
        ])->delete();

        // Recreate them
        $savedLessons = [];
        foreach ($request->lessons as $lessonName) {
            if (empty(trim($lessonName))) continue;
            
            $savedLessons[] = Lesson::create([
                'class_name' => $request->class_name,
                'section' => $request->section,
                'subject_group' => $request->subject_group,
                'subject' => $request->subject,
                'lesson' => $lessonName,
            ]);
        }

        return response()->json([
            'message' => 'Lessons updated successfully',
            'data' => $savedLessons
        ]);
    }

    public function destroy($id)
    {
        $lesson = Lesson::findOrFail($id);
        
        // Delete all lessons that match the same group
        Lesson::where([
            'class_name' => $lesson->class_name,
            'section' => $lesson->section,
            'subject_group' => $lesson->subject_group,
            'subject' => $lesson->subject,
        ])->delete();

        return response()->json(['message' => 'Lessons deleted successfully']);
    }
}
