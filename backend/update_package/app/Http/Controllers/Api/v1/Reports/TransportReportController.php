<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StudentTransportAssignment;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\TransportRoute;
use App\Models\TransportPickupPoint;
use App\Models\TransportVehicle;

class TransportReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/transport/criteria                                      */
    /** ------------------------------------------------------------------ */
    public function getCriteria()
    {
        return response()->json([
            'classes' => SchoolClass::with('sections')->get(),
            'sections' => Section::all(),
            'routes' => TransportRoute::all(),
            'pickupPoints' => TransportPickupPoint::all(),
            'vehicles' => TransportVehicle::all(),
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/transport/search                                        */
    /** ------------------------------------------------------------------ */
    public function getTransportReport(Request $request)
    {
        $classId = $request->query('class_id');
        $sectionId = $request->query('section_id');
        $routeId = $request->query('route_id');
        $pickupPointId = $request->query('pickup_point_id');
        $vehicleId = $request->query('vehicle_id');

        $query = StudentTransportAssignment::with([
            'student.schoolClass',
            'student.section',
            'route',
            'vehicle',
            'pickupPoint'
        ]);

        if ($routeId) {
            $query->where('route_id', $routeId);
        }
        if ($pickupPointId) {
            $query->where('pickup_point_id', $pickupPointId);
        }
        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($classId || $sectionId) {
            $query->whereHas('student', function ($q) use ($classId, $sectionId) {
                if ($classId) {
                    $q->where('school_class_id', $classId);
                }
                if ($sectionId) {
                    $q->where('section_id', $sectionId);
                }
            });
        }

        $assignments = $query->get()->map(function ($assignment) {
            $student = $assignment->student;
            
            // Get monthly fare from route pickup points pivot
            $pivot = \DB::connection()->table('transport_route_pickup_points')
                ->where('route_id', $assignment->route_id)
                ->where('pickup_point_id', $assignment->pickup_point_id)
                ->first();
            $fare = $pivot ? (float) $pivot->monthly_fees : 0.0;

            return [
                'class'          => $student && $student->schoolClass ? ($student->schoolClass->name . ($student->section ? ' (' . $student->section->name . ')' : '')) : '-',
                'admission_no'   => $student->admission_no ?? '-',
                'student_name'   => $student ? trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')) : '-',
                'mobile_number'  => $student->phone ?? '-',
                'father_name'    => $student->father_name ?? '-',
                'route_title'    => optional($assignment->route)->title ?? '-',
                'vehicle_number' => optional($assignment->vehicle)->vehicle_no ?? '-',
                'pickup_point'   => optional($assignment->pickupPoint)->name ?? '-',
                'driver_name'    => optional($assignment->vehicle)->driver_name ?? '-',
                'driver_contact' => optional($assignment->vehicle)->driver_contact ?? '-',
                'fare'           => number_format($fare, 2),
            ];
        });

        return response()->json([
            'data' => $assignments,
        ]);
    }
}
