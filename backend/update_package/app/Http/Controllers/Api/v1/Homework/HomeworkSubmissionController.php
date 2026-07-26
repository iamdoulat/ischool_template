<?php

namespace App\Http\Controllers\Api\v1\Homework;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class HomeworkSubmissionController extends Controller
{
    /**
     * List all submissions for a specific homework (teacher view).
     */
    public function index(Request $request, $homeworkId)
    {
        $homework = Homework::findOrFail($homeworkId);

        $submissions = HomeworkSubmission::with(['student', 'evaluator'])
            ->where('homework_id', $homeworkId)
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate($request->limit ?? 20);

        return response()->json([
            'homework' => $homework->load(['schoolClass', 'section', 'subject']),
            'submissions' => $submissions,
        ]);
    }

    /**
     * Student submits homework (POST /user/homework/{id}/submit).
     */
    public function submit(Request $request, $homeworkId)
    {
        $student = Auth::user();
        $homework = Homework::findOrFail($homeworkId);

        $validator = Validator::make($request->all(), [
            'student_answer' => 'nullable|string',
            'submission_file' => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $submissionData = [
            'homework_id'   => $homeworkId,
            'student_id'    => $student->id,
            'student_answer' => $request->student_answer,
            'submitted_at'  => Carbon::now(),
            'status'        => 'submitted',
        ];

        if ($request->hasFile('submission_file')) {
            $file = $request->file('submission_file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/submissions', $filename, 'public');
            $submissionData['submission_file'] = '/storage/' . $path;
        }

        // Upsert: one submission per student per homework
        $submission = HomeworkSubmission::updateOrCreate(
            ['homework_id' => $homeworkId, 'student_id' => $student->id],
            $submissionData
        );

        return response()->json([
            'message' => 'Homework submitted successfully',
            'data'    => $submission,
        ]);
    }

    /**
     * Teacher evaluates a submission (PUT /homework/submissions/{id}/evaluate).
     */
    public function evaluate(Request $request, $id)
    {
        $submission = HomeworkSubmission::with(['homework', 'student'])->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'marks_obtained'  => 'required|numeric|min:0',
            'evaluation_date' => 'required|date',
            'teacher_remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $submission->update([
            'marks_obtained'  => $request->marks_obtained,
            'evaluation_date' => $request->evaluation_date,
            'evaluated_by'    => Auth::id(),
            'teacher_remarks' => $request->teacher_remarks,
            'status'          => 'evaluated',
        ]);

        return response()->json([
            'message' => 'Submission evaluated successfully',
            'data'    => $submission->fresh(['student', 'evaluator']),
        ]);
    }

    /**
     * Get current user's submission for a homework.
     */
    public function mySubmission($homeworkId)
    {
        $submission = HomeworkSubmission::with(['evaluator'])
            ->where('homework_id', $homeworkId)
            ->where('student_id', Auth::id())
            ->first();

        return response()->json(['data' => $submission]);
    }
}
