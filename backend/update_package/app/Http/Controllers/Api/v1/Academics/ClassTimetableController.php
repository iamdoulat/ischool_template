<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Api\BaseController;
use App\Models\ClassTimetable;
use App\Models\AcademicSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClassTimetableController extends BaseController
{
    /**
     * List timetable entries for a specific class/section or teacher.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required_without:staff_id|exists:school_classes,id',
            'section_id' => 'required_without:staff_id|exists:sections,id',
            'subject_group_id' => 'nullable|exists:subject_groups,id',
            'staff_id' => 'required_without:school_class_id|exists:users,id',
        ]);

        $query = ClassTimetable::with(['subject', 'staff', 'schoolClass', 'section']);

        if ($request->has('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->has('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->has('subject_group_id')) {
            $query->where('subject_group_id', $request->subject_group_id);
        }

        $entries = $query->get();

        return $this->success($entries, 'Timetable entries retrieved successfully');
    }

    /**
     * Store or update a timetable entry.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'subject_group_id' => 'nullable|exists:subject_groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'staff_id' => 'required|exists:users,id',
            'day' => 'required|string',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room' => 'nullable|string',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
        ]);

        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $data = $request->all();
        $data['academic_session_id'] = $request->academic_session_id ?? $activeSessionId;

        $entry = ClassTimetable::create($data);

        return $this->success($entry, 'Timetable entry created successfully', 201);
    }

    /**
     * Batch store timetable entries for a specific day/criteria.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'subject_group_id' => 'required|exists:subject_groups,id',
            'day' => 'required|string',
            'entries' => 'required|array',
            'entries.*.subject_id' => 'required|exists:subjects,id',
            'entries.*.staff_id' => 'required|exists:users,id',
            'entries.*.start_time' => 'required|string',
            'entries.*.end_time' => 'required|string',
            'entries.*.room' => 'nullable|string',
        ]);

        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        return DB::transaction(function () use ($request, $activeSessionId) {
            // Delete existing entries for this day/criteria to overwrite
            ClassTimetable::where('school_class_id', $request->school_class_id)
                ->where('section_id', $request->section_id)
                ->where('subject_group_id', $request->subject_group_id)
                ->where('day', $request->day)
                ->delete();

            $created = [];
            foreach ($request->entries as $entryData) {
                $created[] = ClassTimetable::create([
                    'school_class_id' => $request->school_class_id,
                    'section_id' => $request->section_id,
                    'subject_group_id' => $request->subject_group_id,
                    'day' => $request->day,
                    'subject_id' => $entryData['subject_id'],
                    'staff_id' => $entryData['staff_id'],
                    'start_time' => $entryData['start_time'],
                    'end_time' => $entryData['end_time'],
                    'room' => $entryData['room'] ?? null,
                    'academic_session_id' => $activeSessionId,
                ]);
            }

            return $this->success($created, 'Timetable entries updated successfully');
        });
    }

    /**
     * Remove a timetable entry.
     */
    public function destroy($id): JsonResponse
    {
        $class_timetable = ClassTimetable::findOrFail($id);
        $class_timetable->delete();
        return $this->success(null, 'Timetable entry deleted successfully');
    }
}
