<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\StudentTransportAssignment;
use App\Models\User;
use App\Models\TransportFeeMaster;
use App\Models\StudentTransportFee;
use App\Models\TransportRoutePickupPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentTransportController extends BaseController
{
    public function index(Request $request)
    {
        $query = User::role('Student')->with([
            'transportAssignment.route', 
            'transportAssignment.vehicle', 
            'transportAssignment.pickupPoint',
            'transportFees',
            'schoolClass',
            'section'
        ]);

        if ($request->filled('class_id')) {
            $query->where('school_class_id', $request->class_id);
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('admission_no', 'like', "%$search%");
            });
        }

        $students = $query->get();
        \Illuminate\Support\Facades\Log::info('StudentTransportController@index hit', [
            'filters' => $request->all(),
            'students_count' => $students->count(),
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);
        return $this->success($students, 'Students with transport assignments retrieved successfully');
    }

    public function assign(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:users,id',
            'route_id' => 'required|exists:transport_routes,id',
            'vehicle_id' => 'required|exists:transport_vehicles,id',
            'pickup_point_id' => 'required|exists:transport_pickup_points,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $assignment = StudentTransportAssignment::updateOrCreate(
            ['student_id' => $request->student_id],
            $request->all()
        );

        return $this->success($assignment, 'Transport assigned to student successfully');
    }

    public function removeAssignment($studentId)
    {
        $assignment = StudentTransportAssignment::where('student_id', $studentId)->first();
        if (!$assignment) {
            return $this->error('No transport assignment found for this student', 404);
        }

        $assignment->delete();
        return $this->success(null, 'Transport assignment removed successfully');
    }

    public function assignFees(Request $request, $studentId)
    {
        $assignment = StudentTransportAssignment::where('student_id', $studentId)->first();
        if (!$assignment) {
            return $this->error('Student does not have a transport assignment', 404);
        }

        $routePickupPoint = TransportRoutePickupPoint::where('route_id', $assignment->route_id)
            ->where('pickup_point_id', $assignment->pickup_point_id)
            ->first();

        if (!$routePickupPoint) {
            return $this->error('Invalid route and pickup point combination', 404);
        }

        $amount = $routePickupPoint->monthly_fees;

        $activeSessionId = \App\Models\AcademicSession::where('is_active', true)->value('id');
        $requestedFeeMasterIds = $request->input('fee_master_ids', []);
        
        if (empty($requestedFeeMasterIds)) {
            return $this->error('Please select at least one month', 422);
        }

        // Delete unpaid fees that are no longer selected
        StudentTransportFee::where('student_id', $studentId)
            ->where('academic_session_id', $activeSessionId)
            ->whereNotIn('transport_fee_master_id', $requestedFeeMasterIds)
            ->where('status', 'unpaid')
            ->delete();

        $feeMasters = TransportFeeMaster::where('session_id', $activeSessionId)
            ->whereIn('id', $requestedFeeMasterIds)
            ->get();

        if ($feeMasters->isEmpty()) {
            return $this->error('No transport fee master found', 404);
        }

        $count = 0;
        $existing = 0;
        foreach ($feeMasters as $master) {
            $fee = StudentTransportFee::firstOrCreate(
                [
                    'student_id' => $studentId,
                    'transport_fee_master_id' => $master->id,
                    'academic_session_id' => $activeSessionId,
                ],
                [
                    'amount' => $amount,
                    'status' => 'unpaid'
                ]
            );
            if ($fee->wasRecentlyCreated) {
                $count++;
            } else {
                if ($fee->status === 'unpaid') {
                    $fee->update(['amount' => $amount]);
                }
                $existing++;
            }
        }

        if ($count == 0 && $existing > 0) {
            return $this->success(null, "Fees already assigned for selected months (amounts updated).");
        }

        return $this->success(null, "Transport fees assigned successfully for $count month(s)");
    }
}
