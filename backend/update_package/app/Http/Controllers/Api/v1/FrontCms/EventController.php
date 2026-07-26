<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends BaseController
{
    public function index(): JsonResponse
    {
        $events = FrontCmsEvent::orderBy('start_date', 'asc')->get();
        return $this->success($events, 'Events fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string',
            'venue' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('front-cms/events', 'public');
            $imagePath = Storage::url($path);
        }

        $event = FrontCmsEvent::create([
            'title' => $request->title,
            'venue' => $request->venue,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'description' => $request->description,
            'image_path' => $imagePath,
        ]);

        return $this->success($event, 'Event created successfully', 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $event = FrontCmsEvent::find($id);

        if (!$event) {
            return $this->error('Event not found', 404);
        }

        $request->validate([
            'title' => 'required|string',
            'venue' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('front-cms/events', 'public');
            $event->image_path = Storage::url($path);
        }

        $event->update([
            'title' => $request->title,
            'venue' => $request->venue,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'description' => $request->description,
        ]);

        return $this->success($event, 'Event updated successfully');
    }

    public function destroy($id): JsonResponse
    {
        $event = FrontCmsEvent::find($id);

        if (!$event) {
            return $this->error('Event not found', 404);
        }

        $event->delete();

        return $this->success(null, 'Event deleted successfully');
    }
}
