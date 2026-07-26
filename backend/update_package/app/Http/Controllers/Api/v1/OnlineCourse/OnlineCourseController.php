<?php

namespace App\Http\Controllers\Api\v1\OnlineCourse;

use App\Http\Controllers\Controller;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use App\Models\OnlineCourse;
use App\Models\User;

class OnlineCourseController extends Controller
{
    public function index(Request $request)
    {
        $query = OnlineCourse::with(['instructor:id,name,avatar,admission_no', 'schoolClass', 'section']);

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $courses = $query->paginate($request->get('per_page', 12));

        if ($courses->isEmpty() && !$request->filled('search')) {
            $this->seedCourses();
            $courses = OnlineCourse::with(['instructor:id,name,avatar,admission_no', 'schoolClass', 'section'])->paginate(12);
        }

        return response()->json($courses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'subtitle' => 'nullable|string',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'original_price' => 'nullable|numeric',
            'class_name' => 'nullable|string',
            'class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'instructor_name' => 'nullable|string',
            'image' => 'nullable',
            'outline' => 'nullable|json',
            'live_classes' => 'nullable|json',
            'quizzes' => 'nullable|json',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('courses', 'public');
            $validated['image'] = url('storage/' . $path);
        }

        $validated['instructor_id'] = auth()->id();
        $course = OnlineCourse::create($validated);
        $course->load('instructor');

        NotificationDispatcher::dispatch('Online Course Publish', [
            'title' => $course->title ?? '',
            'category' => $course->category ?? '',
            'price' => $course->price ?? '',
            'instructor_name' => $course->instructor?->name ?? '',
        ], [
            'student_id' => null,
        ]);

        return response()->json(['message' => 'Course created successfully', 'data' => $course]);
    }

    public function update(Request $request, $id)
    {
        $course = OnlineCourse::findOrFail($id);
        $validated = $request->validate([
            'title' => 'required|string',
            'subtitle' => 'nullable|string',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'original_price' => 'nullable|numeric',
            'class_name' => 'nullable|string',
            'class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'instructor_name' => 'nullable|string',
            'image' => 'nullable',
            'outline' => 'nullable|json',
            'live_classes' => 'nullable|json',
            'quizzes' => 'nullable|json',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('courses', 'public');
            $validated['image'] = url('storage/' . $path);
        }

        $course->update($validated);

        return response()->json(['message' => 'Course updated successfully', 'data' => $course]);
    }

    public function destroy($id)
    {
        OnlineCourse::findOrFail($id)->delete();
        return response()->json(['message' => 'Course deleted successfully']);
    }

    private function seedCourses()
    {
        $instructor = User::first();
        if (!$instructor) return;

        $data = [
            [
                'title' => 'English Course for Beginners',
                'description' => 'This course is perfect for anyone looking to improve th... language skills, whether you are a beginner just starting',
                'category' => 'Business Marketing',
                'instructor_id' => $instructor->id,
                'price' => 72.00,
                'original_price' => 80.00,
                'class_name' => 'Class 1',
                'total_lessons' => 2,
                'total_hours' => '02:00:00 Hrs',
                'total_exams' => 1,
                'total_assignments' => 1,
                'total_quizzes' => 0,
                'image' => 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop'
            ],
            [
                'title' => 'Hindi language Course',
                'description' => 'A Hindi language course description typically covers... language skills like speaking, listening, reading, and',
                'category' => 'Lifestyle course',
                'instructor_id' => $instructor->id,
                'price' => 108.00,
                'original_price' => 120.00,
                'class_name' => 'Class 1',
                'total_lessons' => 2,
                'total_hours' => '02:00:00 Hrs',
                'total_exams' => 1,
                'total_assignments' => 1,
                'total_quizzes' => 1,
                'image' => 'https://images.unsplash.com/photo-1590402444681-cd1838b693f9?q=80&w=1974&auto=format&fit=crop'
            ],
            [
                'title' => 'Math Fundamentals',
                'description' => 'A "math course" can be any educational program... covering mathematical concepts, from fundamental',
                'category' => 'UPGRADE SKILL',
                'instructor_id' => $instructor->id,
                'price' => 90.00,
                'original_price' => 100.00,
                'class_name' => 'Class 1',
                'total_lessons' => 2,
                'total_hours' => '05:00:00 Hrs',
                'total_exams' => 1,
                'total_assignments' => 1,
                'total_quizzes' => 1,
                'image' => 'https://images.unsplash.com/photo-1509228468518-180dd482180c?q=80&w=2070&auto=format&fit=crop'
            ],
            [
                'title' => 'ENVIRONMENTAL SCIENCE COURSE',
                'description' => 'An Environmental Science course explores the natural... environment, the impact of human activities, and',
                'category' => 'Lifestyle course',
                'instructor_id' => $instructor->id,
                'price' => 76.50,
                'original_price' => 85.00,
                'class_name' => 'Class 1',
                'total_lessons' => 2,
                'total_hours' => '03:30:00 Hrs',
                'total_exams' => 1,
                'total_assignments' => 1,
                'total_quizzes' => 1,
                'image' => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop'
            ]
        ];

        foreach ($data as $course) {
            OnlineCourse::create($course);
        }
    }
}
