<?php

namespace App\Http\Controllers\Api\v1\Conference;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LiveClass;
use App\Models\SchoolClass;

class LiveClassController extends Controller
{
    public function index(Request $request)
    {
        // Self-healing default curriculum classes seeder
        if (\App\Models\LiveClass::count() === 0) {
            $class = \App\Models\SchoolClass::first();
            $section = \App\Models\Section::first();
            $user = \App\Models\User::first() ?: \App\Models\User::create([
                'name' => 'William',
                'last_name' => 'Abbot',
                'email' => 'admin@ischool.com',
                'password' => bcrypt('password'),
                'role' => 'admin'
            ]);
            $teacher = \App\Models\User::where('role', 'teacher')->first() ?: \App\Models\User::create([
                'name' => 'Jason',
                'last_name' => 'Sharlton',
                'email' => 'jason@ischool.com',
                'password' => bcrypt('password'),
                'role' => 'teacher',
                'employee_id' => '9006'
            ]);

            if ($class && $section) {
                \App\Models\LiveClass::insert([
                    [
                        'title' => 'Maths Live Class - Chapter 3',
                        'description' => 'Trigonometry fundamentals live session',
                        'date_time' => '2026-04-20 09:30:00',
                        'api_used' => 'Global',
                        'created_by' => $user->id,
                        'staff_id' => $teacher->id,
                        'class_id' => $class->id,
                        'section_id' => $section->id,
                        'total_join' => 2,
                        'status' => 'awaited',
                        'join_url' => 'https://zoom.us/j/2345678901',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'title' => 'Physics Live Session - Gravity',
                        'description' => 'Universal gravitation principles discussion',
                        'date_time' => '2026-02-15 10:45:00',
                        'api_used' => 'Global',
                        'created_by' => $user->id,
                        'staff_id' => $teacher->id,
                        'class_id' => $class->id,
                        'section_id' => $section->id,
                        'total_join' => 4,
                        'status' => 'awaited',
                        'join_url' => 'https://zoom.us/j/8765432109',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                ]);
            }
        }

        $query = LiveClass::with(['creator', 'staff', 'schoolClass', 'section']);

        if ($request->has('class_id') && $request->class_id != '') {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('section_id') && $request->section_id != '') {
            $query->where('section_id', $request->section_id);
        }

        if ($request->has('search') && $request->search != '') {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $perPage = $request->per_page ? intval($request->per_page) : 50;
        return response()->json($query->paginate($perPage));
    }

    public function getCriteria()
    {
        return response()->json([
            'classes' => SchoolClass::with('sections')->get(),
            'staff' => \App\Models\User::where('role', '!=', 'student')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'date_time' => 'required',
            'class_id' => 'required',
            'section_id' => 'required',
        ]);

        $liveClass = LiveClass::create($request->all());
        return response()->json(['message' => 'Live Class created successfully', 'data' => $liveClass]);
    }

    public function show($id)
    {
        return response()->json(LiveClass::with(['creator', 'staff', 'schoolClass', 'section'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $liveClass = LiveClass::findOrFail($id);
        $liveClass->update($request->all());
        return response()->json(['message' => 'Live Class updated successfully', 'data' => $liveClass]);
    }

    public function destroy($id)
    {
        LiveClass::findOrFail($id)->delete();
        return response()->json(['message' => 'Live Class deleted successfully']);
    }
}
