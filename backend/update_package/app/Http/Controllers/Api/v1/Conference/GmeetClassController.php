<?php

namespace App\Http\Controllers\Api\v1\Conference;

use App\Http\Controllers\Controller;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use App\Models\GmeetClass;
use App\Models\SchoolClass;
use App\Models\User;

class GmeetClassController extends Controller
{
    public function index(Request $request)
    {
        // Auto-seed G-Meet classes if empty for rich UI matching image
        if (GmeetClass::count() === 0) {
            $admin = User::where('role', 'Super Admin')->first() ?? User::first();
            $teacher = User::where('role', 'Teacher')->first() ?? User::first();
            $class1 = SchoolClass::where('name', 'Class 1')->first() ?? SchoolClass::first();
            $section1 = $class1 ? $class1->sections()->first() : null;
            $class2 = SchoolClass::where('name', 'Class 2')->first() ?? SchoolClass::first();
            $section2 = $class2 ? $class2->sections()->first() : null;

            if ($admin && $teacher && $class1 && $section1) {
                $mockClasses = [
                    [
                        'title' => 'Class - Mathematics',
                        'description' => 'Class - Mathematics',
                        'date_time' => '2026-05-29 17:35:00',
                        'duration' => 29,
                        'created_by' => $admin->id,
                        'staff_id' => $teacher->id,
                        'class_id' => $class1->id,
                        'section_id' => $section1->id,
                        'status' => 'awaited',
                        'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                    ],
                    [
                        'title' => 'Extra Practice Class',
                        'description' => 'Extra Practice Class',
                        'date_time' => '2026-05-15 17:34:00',
                        'duration' => 20,
                        'created_by' => $admin->id,
                        'staff_id' => $teacher->id,
                        'class_id' => $class1->id,
                        'section_id' => $section1->id,
                        'status' => 'awaited',
                        'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                    ],
                    [
                        'title' => 'GK Combined Online Classes',
                        'description' => 'GK Combined Online Classes',
                        'date_time' => '2026-05-06 17:33:00',
                        'duration' => 20,
                        'created_by' => $admin->id,
                        'staff_id' => $teacher->id,
                        'class_id' => $class2 ? $class2->id : $class1->id,
                        'section_id' => $section2 ? $section2->id : $section1->id,
                        'status' => 'awaited',
                        'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                    ],
                    [
                        'title' => 'Live Class - May 2026',
                        'description' => 'Live Class - April 2026',
                        'date_time' => '2026-05-02 17:32:00',
                        'duration' => 20,
                        'created_by' => $admin->id,
                        'staff_id' => $teacher->id,
                        'class_id' => $class1->id,
                        'section_id' => $section1->id,
                        'status' => 'awaited',
                        'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                    ],
                ];

                foreach ($mockClasses as $mc) {
                    GmeetClass::create($mc);
                }
            }
        }

        $query = GmeetClass::with(['creator', 'staff', 'schoolClass.sections', 'section']);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->has('search') && $request->search != '') {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function getCriteria()
    {
        return response()->json([
            'classes' => SchoolClass::with('sections')->get(),
            'staff' => User::where('role', '!=', 'student')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'date_time' => 'required',
            'class_id' => 'required',
            'section_id' => 'required',
            'staff_id' => 'required',
        ]);

        $gmeetClass = GmeetClass::create($request->all());
        $gmeetClass->load(['staff', 'schoolClass', 'section']);
        $teacher = $gmeetClass->staff ?? User::find(auth()->id());

        NotificationDispatcher::dispatch('Gmeet Live Classes', [
            'class_title' => $gmeetClass->title ?? '',
            'class_date_time' => $gmeetClass->date_time ?? '',
            'class' => $gmeetClass->schoolClass?->name ?? '',
            'section' => $gmeetClass->section?->name ?? '',
            'teacher_name' => $teacher?->name ?? '',
        ], [
            'student_id' => null,
        ]);

        return response()->json(['message' => 'G-Meet Class created successfully', 'data' => $gmeetClass]);
    }

    public function show($id)
    {
        return response()->json(GmeetClass::with(['creator', 'staff', 'schoolClass', 'section'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $gmeetClass = GmeetClass::findOrFail($id);
        $gmeetClass->update($request->all());
        return response()->json(['message' => 'G-Meet Class updated successfully', 'data' => $gmeetClass]);
    }

    public function destroy($id)
    {
        GmeetClass::findOrFail($id)->delete();
        return response()->json(['message' => 'G-Meet Class deleted successfully']);
    }
}
