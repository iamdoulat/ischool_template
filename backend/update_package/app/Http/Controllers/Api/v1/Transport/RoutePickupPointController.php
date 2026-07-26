<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\TransportRoute;
use App\Models\TransportRoutePickupPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoutePickupPointController extends BaseController
{
    public function index()
    {
        $mappings = TransportRoute::with('pickupPoints')->get();
        return $this->success($mappings, 'Route pickup point mappings retrieved successfully');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'route_id' => 'required|exists:transport_routes,id',
            'pickup_point_id' => 'required|exists:transport_pickup_points,id',
            'monthly_fees' => 'required|numeric|min:0',
            'distance' => 'nullable|numeric|min:0',
            'pickup_time' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        // Check if mapping already exists
        $exists = TransportRoutePickupPoint::where('route_id', $request->route_id)
            ->where('pickup_point_id', $request->pickup_point_id)
            ->exists();

        if ($exists) {
            return $this->error('Mapping already exists for this route and pickup point', 422);
        }

        $mapping = TransportRoutePickupPoint::create($request->all());
        return $this->success($mapping, 'Route pickup point mapping created successfully', 201);
    }

    public function show($id)
    {
        $mapping = TransportRoutePickupPoint::with(['route', 'pickupPoint'])->find($id);
        if (!$mapping) {
            return $this->error('Mapping not found', 404);
        }
        return $this->success($mapping, 'Mapping retrieved successfully');
    }

    public function update(Request $request, $id)
    {
        $mapping = TransportRoutePickupPoint::find($id);
        if (!$mapping) {
            return $this->error('Mapping not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'route_id' => 'sometimes|required|exists:transport_routes,id',
            'pickup_point_id' => 'sometimes|required|exists:transport_pickup_points,id',
            'monthly_fees' => 'sometimes|required|numeric|min:0',
            'distance' => 'nullable|numeric|min:0',
            'pickup_time' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $mapping->update($request->all());
        return $this->success($mapping, 'Mapping updated successfully');
    }

    public function destroy($id)
    {
        $mapping = TransportRoutePickupPoint::find($id);
        if (!$mapping) {
            return $this->error('Mapping not found', 404);
        }

        $mapping->delete();
        return $this->success(null, 'Mapping deleted successfully');
    }

    public function getByRoute($routeId)
    {
        $mappings = TransportRoutePickupPoint::with('pickupPoint')
            ->where('route_id', $routeId)
            ->get();
        return $this->success($mappings, 'Mappings for route retrieved successfully');
    }
}
