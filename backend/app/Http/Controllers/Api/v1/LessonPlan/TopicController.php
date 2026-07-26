<?php

namespace App\Http\Controllers\Api\v1\LessonPlan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Topic;
use Illuminate\Support\Str;

class TopicController extends Controller
{
    public function index()
    {
        $topics = Topic::all();

        // Group topics by lesson_id for the UI
        $grouped = [];
        foreach ($topics as $topic) {
            $key = $topic->class_name . '|' . $topic->section . '|' . $topic->subject_group . '|' . $topic->subject . '|' . $topic->lesson;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'id' => $topic->id, // Use the first ID as reference for edit/delete
                    'className' => $topic->class_name,
                    'section' => $topic->section,
                    'subjectGroup' => $topic->subject_group,
                    'subject' => $topic->subject,
                    'lesson' => $topic->lesson,
                    'topics' => [],
                    'topic_ids' => []
                ];
            }
            $grouped[$key]['topics'][] = [
                'id' => $topic->id,
                'name' => $topic->topic,
                'is_completed' => $topic->is_completed,
                'completion_date' => $topic->completion_date
            ];
            $grouped[$key]['topic_ids'][] = $topic->id;
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
            'lesson' => 'required|string',
            'topics' => 'required|array'
        ]);

        $savedTopics = [];
        foreach ($request->topics as $topicName) {
            if (empty(trim($topicName))) continue;
            
            $savedTopics[] = Topic::create([
                'class_name' => $request->class_name,
                'section' => $request->section,
                'subject_group' => $request->subject_group,
                'subject' => $request->subject,
                'lesson' => $request->lesson,
                'topic' => $topicName,
            ]);
        }

        return response()->json([
            'message' => 'Topics created successfully',
            'data' => $savedTopics
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject_group' => 'required|string',
            'subject' => 'required|string',
            'lesson' => 'required|string',
            'topics' => 'required|array',
            'topic_ids' => 'required|array'
        ]);

        // First delete all existing topics for this lesson group that are no longer present
        $existingTopics = Topic::where([
            'class_name' => $request->class_name,
            'section' => $request->section,
            'subject_group' => $request->subject_group,
            'subject' => $request->subject,
            'lesson' => $request->lesson,
        ])->get();

        foreach ($existingTopics as $existing) {
            $existing->delete();
        }

        // Recreate them
        $savedTopics = [];
        foreach ($request->topics as $topicName) {
            if (empty(trim($topicName))) continue;
            
            $savedTopics[] = Topic::create([
                'class_name' => $request->class_name,
                'section' => $request->section,
                'subject_group' => $request->subject_group,
                'subject' => $request->subject,
                'lesson' => $request->lesson,
                'topic' => $topicName,
            ]);
        }

        return response()->json([
            'message' => 'Topics updated successfully',
            'data' => $savedTopics
        ]);
    }

    public function destroy($id)
    {
        $topic = Topic::findOrFail($id);
        
        // Delete all topics that match the same group
        Topic::where([
            'class_name' => $topic->class_name,
            'section' => $topic->section,
            'subject_group' => $topic->subject_group,
            'subject' => $topic->subject,
            'lesson' => $topic->lesson,
        ])->delete();

        return response()->json(['message' => 'Topics deleted successfully']);
    }
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'is_completed' => 'required|boolean',
            'completion_date' => 'nullable|date'
        ]);

        $topic = Topic::findOrFail($id);
        $topic->update([
            'is_completed' => $request->is_completed,
            'completion_date' => $request->is_completed ? ($request->completion_date ?? now()->format('Y-m-d')) : null
        ]);

        return response()->json(['message' => 'Status updated successfully', 'data' => $topic]);
    }
    public function copy(Request $request)
    {
        $request->validate([
            'from_class' => 'required|string',
            'from_section' => 'required|string',
            'from_subject_group' => 'required|string',
            'from_subject' => 'required|string',
            'to_class' => 'required|string',
            'to_section' => 'required|string',
            'to_subject_group' => 'required|string',
            'to_subject' => 'required|string',
            'topic_ids' => 'required|array'
        ]);

        $topicsToCopy = Topic::whereIn('id', $request->topic_ids)->get();

        $copiedCount = 0;
        foreach ($topicsToCopy as $topic) {
            Topic::create([
                'class_name' => $request->to_class,
                'section' => $request->to_section,
                'subject_group' => $request->to_subject_group,
                'subject' => $request->to_subject,
                'lesson' => $topic->lesson,
                'topic' => $topic->topic,
                'is_completed' => false,
                'completion_date' => null
            ]);
            $copiedCount++;
        }

        return response()->json(['message' => "$copiedCount topics copied successfully"]);
    }
}
