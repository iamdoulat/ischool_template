<?php

namespace App\Http\Controllers\Api\v1\Conference;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LiveMeeting;

class LiveMeetingController extends Controller
{
    public function index(Request $request)
    {
        // Self-healing default visual seeder
        if (\App\Models\LiveMeeting::count() === 0) {
            $user = \App\Models\User::first() ?: \App\Models\User::create([
                'name' => 'William',
                'last_name' => 'Abbot',
                'email' => 'admin@ischool.com',
                'password' => bcrypt('password'),
                'role' => 'admin'
            ]);

            \App\Models\LiveMeeting::insert([
                [
                    'title' => 'Zoom Staff Meeting - April 2026',
                    'description' => 'Monthly staff meeting via zoom - April 2026',
                    'date_time' => '2026-04-23 11:00:00',
                    'api_used' => 'Global',
                    'created_by' => $user->id,
                    'total_join' => 0,
                    'status' => 'awaited',
                    'join_url' => 'https://zoom.us/j/1234567890',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'title' => 'Time Table change discussion',
                    'description' => 'Time Table change discussion',
                    'date_time' => '2026-01-05 14:00:00',
                    'api_used' => 'Global',
                    'created_by' => $user->id,
                    'total_join' => 2,
                    'status' => 'awaited',
                    'join_url' => 'https://zoom.us/j/9876543210',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'title' => 'Student Health Serve Mission',
                    'description' => 'Student Health Serve Mission',
                    'date_time' => '2025-12-05 14:00:00',
                    'api_used' => 'Global',
                    'created_by' => $user->id,
                    'total_join' => 2,
                    'status' => 'awaited',
                    'join_url' => 'https://zoom.us/j/1112223330',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        $query = LiveMeeting::with('creator');

        if ($request->has('search') && $request->search != '') {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->per_page ? intval($request->per_page) : 50;
        return response()->json($query->paginate($perPage));
    }

    public function getCriteria()
    {
        return response()->json([
            'staff' => \App\Models\User::where('role', '!=', 'student')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'date_time' => 'required',
        ]);

        $meeting = LiveMeeting::create($request->all());
        return response()->json(['message' => 'Meeting created successfully', 'data' => $meeting]);
    }

    public function show($id)
    {
        return response()->json(LiveMeeting::with('creator')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $meeting = LiveMeeting::findOrFail($id);
        $meeting->update($request->all());
        return response()->json(['message' => 'Meeting updated successfully', 'data' => $meeting]);
    }

    public function destroy($id)
    {
        LiveMeeting::findOrFail($id)->delete();
        return response()->json(['message' => 'Meeting deleted successfully']);
    }
}
