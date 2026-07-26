<?php

namespace App\Http\Controllers\Api\v1\Behaviour;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Incident;
use App\Models\AssignedIncident;
use App\Services\NotificationDispatcher;
use Illuminate\Support\Facades\DB;

class AssignedIncidentController extends Controller
{
    public function index(Request $request)
    {
        $query = AssignedIncident::with(['incident', 'assigner:id,name']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        return response()->json($query->orderBy('incident_date', 'desc')->get());
    }

    public function searchStudents(Request $request)
    {
        $request->validate([
            'class_id' => 'required',
            'section_id' => 'required',
        ]);

        $students = User::role('Student')
            ->where('school_class_id', $request->class_id)
            ->where('section_id', $request->section_id)
            ->withCount(['assignedIncidents as total_points' => function ($query) {
                $query->select(DB::raw('sum(point)'));
            }])
            ->get();

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'incident_id' => 'required|exists:incidents,id',
            'incident_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $incident = Incident::find($request->incident_id);
        $assignedBy = auth()->id();

        $studentUsers = User::whereIn('id', $request->student_ids)->get()->keyBy('id');

        foreach ($request->student_ids as $student_id) {
            AssignedIncident::create([
                'student_id' => $student_id,
                'incident_id' => $request->incident_id,
                'point' => $incident->point,
                'description' => $request->description,
                'incident_date' => $request->incident_date,
                'assigned_by' => $assignedBy,
            ]);

            $student = $studentUsers->get($student_id);
            if ($student) {
                NotificationDispatcher::dispatch('Behaviour Incident Assigned', [
                    'incident_title' => $incident->title ?? '',
                    'incident_point' => (string)($incident->point ?? '0'),
                    'student_name' => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                    'class' => $student->schoolClass->name ?? '',
                    'section' => $student->section->name ?? '',
                    'admission_no' => $student->admission_no ?? '',
                    'mobileno' => $student->phone ?? '',
                    'email' => $student->email ?? '',
                    'guardian_name' => $student->guardian_name ?? '',
                    'guardian_phone' => $student->guardian_phone ?? '',
                    'guardian_email' => $student->guardian_email ?? '',
                ], [
                    'student_id' => $student_id,
                    'guardian_id' => $student_id,
                ]);
            }
        }

        return response()->json(['message' => 'Incident(s) assigned successfully']);
    }

    public function destroy($id)
    {
        AssignedIncident::findOrFail($id)->delete();
        return response()->json(['message' => 'Assigned incident removed']);
    }
}
