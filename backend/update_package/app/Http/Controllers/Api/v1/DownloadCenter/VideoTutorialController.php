<?php

namespace App\Http\Controllers\Api\v1\DownloadCenter;

use App\Http\Controllers\Controller;
use App\Models\VideoTutorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VideoTutorialController extends Controller
{
    public function index(Request $request)
    {
        $query = VideoTutorial::with(['schoolClass', 'section']);

        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->section_id) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $tutorials = $query->latest()->paginate($request->limit ?? 12);

        return response()->json($tutorials);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'video_url' => 'required|url',
            'class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tutorial = VideoTutorial::create($request->all());

        return response()->json([
            'message' => 'Video Tutorial created successfully',
            'data' => $tutorial
        ], 201);
    }

    public function show(VideoTutorial $videoTutorial)
    {
        return response()->json($videoTutorial->load(['schoolClass', 'section']));
    }

    public function update(Request $request, VideoTutorial $videoTutorial)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'video_url' => 'required|url',
            'class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $videoTutorial->update($request->all());

        return response()->json([
            'message' => 'Video Tutorial updated successfully',
            'data' => $videoTutorial
        ]);
    }

    public function destroy(VideoTutorial $videoTutorial)
    {
        $videoTutorial->delete();

        return response()->json([
            'message' => 'Video Tutorial deleted successfully'
        ]);
    }
}
