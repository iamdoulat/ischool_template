<?php

namespace App\Http\Controllers\Api\v1\Alumni;

use App\Http\Controllers\Controller;
use App\Models\AlumniEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AlumniEventController extends Controller
{
    public function index()
    {
        $events = AlumniEvent::with(['schoolClass', 'section', 'session'])->latest()->get();
        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_title' => 'required|string|max:255',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'session_id' => 'nullable|exists:academic_sessions,id',
            'show_on_app' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $event = AlumniEvent::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully',
            'data' => $event
        ], 201);
    }

    public function show(AlumniEvent $event)
    {
        return response()->json([
            'success' => true,
            'data' => $event->load(['schoolClass', 'section', 'session'])
        ]);
    }

    public function update(Request $request, AlumniEvent $event)
    {
        $validator = Validator::make($request->all(), [
            'event_title' => 'required|string|max:255',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'session_id' => 'nullable|exists:academic_sessions,id',
            'show_on_app' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $event->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Event updated successfully',
            'data' => $event
        ]);
    }

    public function destroy(AlumniEvent $event)
    {
        $event->delete();
        return response()->json([
            'success' => true,
            'message' => 'Event deleted successfully'
        ]);
    }
}
