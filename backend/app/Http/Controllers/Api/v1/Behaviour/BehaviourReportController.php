<?php

namespace App\Http\Controllers\Api\v1\Behaviour;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;

class BehaviourReportController extends Controller
{
    public function getCriteria()
    {
        return response()->json([
            'classes' => SchoolClass::with('sections')->get(),
            'sessions' => [
                ['id' => 'current', 'label' => 'Current Session Points'],
                ['id' => 'all', 'label' => 'All Sessions']
            ]
        ]);
    }

    public function index(Request $request)
    {
        $class_id = $request->get('class_id');
        $section_id = $request->get('section_id');
        $type = $request->get('type', 'incident');

        $students = User::role('student')
            ->when($class_id, fn($q) => $q->where('school_class_id', $class_id))
            ->when($section_id, fn($q) => $q->where('section_id', $section_id))
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->withCount([
                'assignedIncidents as total_incidents',
                'assignedIncidents as total_points' => fn($q) => $q->select(DB::raw('COALESCE(SUM(point),0)')),
            ])
            ->get();

        // Order by total_points desc for rank-type reports
        if (in_array($type, ['behaviour', 'class_rank', 'section_rank', 'house_rank'])) {
            $students = $students->sortByDesc('total_points')->values();
        } else {
            $students = $students->values();
        }

        $data = $students->map(fn($u) => [
            'id' => $u->id,
            'admission_no' => $u->admission_no,
            'name' => $u->name,
            'class' => $u->schoolClass->name ?? '',
            'section' => $u->section->name ?? '',
            'gender' => $u->gender,
            'phone' => $u->phone,
            'total_incidents' => (int) $u->total_incidents,
            'total_points' => (int) $u->total_points,
        ]);

        return response()->json([
            'data' => $data,
            'total' => $data->count()
        ]);
    }
}