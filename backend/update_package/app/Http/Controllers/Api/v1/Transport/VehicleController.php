<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\TransportVehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleController extends BaseController
{
    public function index()
    {
        $vehicles = TransportVehicle::all();
        return $this->success($vehicles, 'Vehicles retrieved successfully');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vehicle_no' => 'required|string|max:255',
            'vehicle_model' => 'nullable|string|max:255',
            'year_made' => 'nullable|string|max:255',
            'registration_no' => 'nullable|string|max:255',
            'chassis_no' => 'nullable|string|max:255',
            'max_seating_capacity' => 'nullable|string|max:255',
            'driver_name' => 'nullable|string|max:255',
            'driver_license' => 'nullable|string|max:255',
            'driver_contact' => 'nullable|string|max:255',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $vehicle = TransportVehicle::create($request->all());
        return $this->success($vehicle, 'Vehicle created successfully', 201);
    }

    public function show($id)
    {
        $vehicle = TransportVehicle::find($id);
        if (!$vehicle) {
            return $this->error('Vehicle not found', 404);
        }
        return $this->success($vehicle, 'Vehicle retrieved successfully');
    }

    public function update(Request $request, $id)
    {
        $vehicle = TransportVehicle::find($id);
        if (!$vehicle) {
            return $this->error('Vehicle not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_no' => 'sometimes|required|string|max:255',
            'vehicle_model' => 'nullable|string|max:255',
            'year_made' => 'nullable|string|max:255',
            'registration_no' => 'nullable|string|max:255',
            'chassis_no' => 'nullable|string|max:255',
            'max_seating_capacity' => 'nullable|string|max:255',
            'driver_name' => 'nullable|string|max:255',
            'driver_license' => 'nullable|string|max:255',
            'driver_contact' => 'nullable|string|max:255',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $vehicle->update($request->all());
        return $this->success($vehicle, 'Vehicle updated successfully');
    }

    public function destroy($id)
    {
        $vehicle = TransportVehicle::find($id);
        if (!$vehicle) {
            return $this->error('Vehicle not found', 404);
        }

        $vehicle->delete();
        return $this->success(null, 'Vehicle deleted successfully');
    }
}
