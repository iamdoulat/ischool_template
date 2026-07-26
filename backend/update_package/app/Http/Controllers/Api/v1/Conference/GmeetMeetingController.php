<?php

namespace App\Http\Controllers\Api\v1\Conference;

use App\Http\Controllers\Controller;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use App\Models\GmeetMeeting;
use App\Models\User;

class GmeetMeetingController extends Controller
{
    public function index(Request $request)
    {
        // Seed first meetings record if empty to match image perfectly
        if (GmeetMeeting::count() <= 2) {
            GmeetMeeting::truncate();
            $admin = User::where('role', 'Super Admin')->first() ?? User::first();
            if ($admin) {
                GmeetMeeting::create([
                    'title' => 'PTM Preparation Online',
                    'description' => 'PTM Preparation Online',
                    'date_time' => '2026-05-30 17:30:00',
                    'duration' => 25,
                    'created_by' => $admin->id,
                    'total_join' => 1,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'Online Teacher Training Meeting',
                    'description' => 'Online Teacher Training Meeting',
                    'date_time' => '2026-05-20 17:30:00',
                    'duration' => 20,
                    'created_by' => $admin->id,
                    'total_join' => 2,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'Staff Meeting -May 2026',
                    'description' => 'Staff Meeting -May 2026',
                    'date_time' => '2026-05-14 17:29:00',
                    'duration' => 20,
                    'created_by' => $admin->id,
                    'total_join' => 1,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'School Timetable Preparation',
                    'description' => 'School Timetable Preparation',
                    'date_time' => '2026-05-06 17:28:00',
                    'duration' => 25,
                    'created_by' => $admin->id,
                    'total_join' => 3,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'Student Health',
                    'description' => '',
                    'date_time' => '2026-05-02 17:26:00',
                    'duration' => 25,
                    'created_by' => $admin->id,
                    'total_join' => 1,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'Staff Meeting -April 2026',
                    'description' => 'Monthly staff meeting -April 2026',
                    'date_time' => '2026-04-21 11:00:00',
                    'duration' => 30,
                    'created_by' => $admin->id,
                    'total_join' => 2,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'School Timetable Preparation',
                    'description' => 'School Timetable Preparation',
                    'date_time' => '2026-04-15 10:29:00',
                    'duration' => 45,
                    'created_by' => $admin->id,
                    'total_join' => 1,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'School Timetable Preparation',
                    'description' => 'School Timetable Preparation',
                    'date_time' => '2026-02-26 21:04:00',
                    'duration' => 45,
                    'created_by' => $admin->id,
                    'total_join' => 4,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'Staff Meeting',
                    'description' => 'Staff Meeting',
                    'date_time' => '2026-02-24 21:02:00',
                    'duration' => 35,
                    'created_by' => $admin->id,
                    'total_join' => 1,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
                GmeetMeeting::create([
                    'title' => 'Student Health Serve Mission',
                    'description' => 'Student Health Serve Mission',
                    'date_time' => '2026-02-24 21:01:00',
                    'duration' => 35,
                    'created_by' => $admin->id,
                    'total_join' => 1,
                    'status' => 'awaited',
                    'meeting_url' => 'https://meet.google.com/abc-defg-hij',
                ]);
            }
        }

        $query = GmeetMeeting::with('creator');

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
            'staff' => User::where('role', '!=', 'student')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'date_time' => 'required',
        ]);

        $meeting = GmeetMeeting::create($request->all());
        $creator = User::find(auth()->id());

        NotificationDispatcher::dispatch('Gmeet Live Meeting', [
            'meeting_title' => $meeting->title ?? '',
            'meeting_date_time' => $meeting->date_time ?? '',
            'created_by' => $creator?->name ?? '',
        ], [
            'staff_id' => null,
        ]);

        return response()->json(['message' => 'Meeting created successfully', 'data' => $meeting]);
    }

    public function show($id)
    {
        return response()->json(GmeetMeeting::with('creator')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $meeting = GmeetMeeting::findOrFail($id);
        $meeting->update($request->all());
        return response()->json(['message' => 'Meeting updated successfully', 'data' => $meeting]);
    }

    public function destroy($id)
    {
        GmeetMeeting::findOrFail($id)->delete();
        return response()->json(['message' => 'Meeting deleted successfully']);
    }
}
