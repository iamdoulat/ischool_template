<?php

namespace App\Http\Controllers\Api\v1\Homework;

use App\Http\Controllers\Controller;
use App\Models\DailyAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DailyAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $assignments = DailyAssignment::with(['student', 'class', 'section', 'subject', 'evaluator'])
            ->when(Auth::user()->role === 'Student', fn($q) => $q->where('student_id', Auth::id()))
            ->when($request->class_id, fn($q, $v) => $q->where('class_id', $v))
            ->when($request->section_id, fn($q, $v) => $q->where('section_id', $v))
            ->when($request->subject_id, fn($q, $v) => $q->where('subject_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->date, fn($q, $v) => $q->whereDate('submission_date', $v))
            ->when($request->search, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                          ->orWhereHas('student', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->limit ?? 20);

        return response()->json($assignments);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id'      => 'required',
            'class_id'        => 'required|exists:school_classes,id',
            'section_id'      => 'required|exists:sections,id',
            'subject_id'      => 'required|exists:subjects,id',
            'title'           => 'required|string|max:255',
            'submission_date' => 'required|date',
            'attachment'      => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'student_id', 'class_id', 'section_id', 'subject_id',
            'title', 'description', 'submission_date', 'evaluation_date',
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/daily-assignments', $filename, 'public');
            $data['attachment'] = '/storage/' . $path;
        }

        $data['status'] = 'pending';

        if ($data['student_id'] === 'all') {
            $studentIds = \App\Models\User::where('role', 'Student')
                ->where('school_class_id', $data['class_id'])
                ->where('section_id', $data['section_id'])
                ->where('active', true)
                ->pluck('id');

            $assignments = [];
            foreach ($studentIds as $id) {
                $studentData = $data;
                $studentData['student_id'] = $id;
                $assignments[] = DailyAssignment::create($studentData);
            }

            return response()->json([
                'message' => 'Assignments created successfully for all students',
                'data'    => $assignments,
            ], 201);
        } elseif (is_array($data['student_id'])) {
            $assignments = [];
            foreach ($data['student_id'] as $id) {
                $studentData = $data;
                $studentData['student_id'] = $id;
                $assignments[] = DailyAssignment::create($studentData);
            }

            return response()->json([
                'message' => 'Assignments created successfully for selected students',
                'data'    => $assignments,
            ], 201);
        } else {
            $assignment = DailyAssignment::create($data);

            return response()->json([
                'message' => 'Assignment created successfully',
                'data'    => $assignment->load(['student', 'class', 'section', 'subject']),
            ], 201);
        }
    }

    public function show(DailyAssignment $dailyAssignment)
    {
        return response()->json($dailyAssignment->load(['student', 'class', 'section', 'subject', 'evaluator']));
    }

    public function update(Request $request, DailyAssignment $dailyAssignment)
    {
        $validator = Validator::make($request->all(), [
            'title'           => 'required|string|max:255',
            'submission_date' => 'required|date',
            'attachment'      => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'student_id', 'class_id', 'section_id', 'subject_id',
            'title', 'description', 'submission_date', 'evaluation_date',
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/daily-assignments', $filename, 'public');
            $data['attachment'] = '/storage/' . $path;
        }

        $dailyAssignment->update($data);

        return response()->json([
            'message' => 'Assignment updated successfully',
            'data'    => $dailyAssignment->fresh(['student', 'class', 'section', 'subject']),
        ]);
    }

    /**
     * Evaluate a daily assignment with marks (teacher action).
     */
    public function evaluate(Request $request, DailyAssignment $dailyAssignment)
    {
        $validator = Validator::make($request->all(), [
            'marks_obtained'  => 'required|numeric|min:0',
            'evaluation_date' => 'required|date',
            'teacher_remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $dailyAssignment->update([
            'marks_obtained'  => $request->marks_obtained,
            'evaluation_date' => $request->evaluation_date,
            'evaluated_by'    => Auth::id(),
            'status'          => 'evaluated',
        ]);

        return response()->json([
            'message' => 'Assignment evaluated successfully',
            'data'    => $dailyAssignment->fresh(['student', 'class', 'section', 'subject', 'evaluator']),
        ]);
    }

    /**
     * Submit a daily assignment (student action).
     */
    public function submit(Request $request, DailyAssignment $dailyAssignment)
    {
        // Ensure the student owns this assignment
        if (Auth::user()->role === 'Student' && $dailyAssignment->student_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($dailyAssignment->status === 'evaluated') {
            return response()->json(['message' => 'Cannot submit evaluated assignment'], 400);
        }

        $validator = Validator::make($request->all(), [
            'student_answer'  => 'nullable|string',
            'submission_file' => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['student_answer']);
        
        if ($request->hasFile('submission_file')) {
            $file = $request->file('submission_file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/daily-assignments/submissions', $filename, 'public');
            $data['submission_file'] = '/storage/' . $path;
        }

        $data['status'] = 'submitted';
        $data['submitted_at'] = now();

        $dailyAssignment->update($data);

        return response()->json([
            'message' => 'Assignment submitted successfully',
            'data'    => $dailyAssignment->fresh(['student', 'class', 'section', 'subject', 'evaluator']),
        ]);
    }

    public function destroy(DailyAssignment $dailyAssignment)
    {
        $dailyAssignment->delete();

        return response()->json(['message' => 'Assignment deleted successfully']);
    }
}
