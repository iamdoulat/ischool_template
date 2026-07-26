<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\TransportPickupPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PickupPointController extends BaseController
{
    public function index()
    {
        $points = TransportPickupPoint::all();
        return $this->success($points, 'Pickup points retrieved successfully');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $point = TransportPickupPoint::create($request->all());
        return $this->success($point, 'Pickup point created successfully', 201);
    }

    public function show($id)
    {
        $point = TransportPickupPoint::find($id);
        if (!$point) {
            return $this->error('Pickup point not found', 404);
        }
        return $this->success($point, 'Pickup point retrieved successfully');
    }

    public function update(Request $request, $id)
    {
        $point = TransportPickupPoint::find($id);
        if (!$point) {
            return $this->error('Pickup point not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $point->update($request->all());
        return $this->success($point, 'Pickup point updated successfully');
    }

    public function destroy($id)
    {
        $point = TransportPickupPoint::find($id);
        if (!$point) {
            return $this->error('Pickup point not found', 404);
        }

        $point->delete();
        return $this->success(null, 'Pickup point deleted successfully');
    }
}
