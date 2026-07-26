<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\TransportRoute;
use App\Models\TransportRouteVehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RouteVehicleController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $assignments = TransportRoute::with('vehicles')->get();
        return $this->success($assignments, 'Vehicle assignments retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'route_id' => 'required|exists:transport_routes,id',
            'vehicle_ids' => 'required|array',
            'vehicle_ids.*' => 'exists:transport_vehicles,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $route = TransportRoute::findOrFail($request->route_id);

        // Sync vehicles for the route
        $route->vehicles()->sync($request->vehicle_ids);

        $route->load('vehicles');
        return $this->success($route, 'Vehicles assigned to route successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $routeId)
    {
        return $this->store($request->merge(['route_id' => $routeId]));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($routeId)
    {
        $route = TransportRoute::findOrFail($routeId);
        $route->vehicles()->detach();
        return $this->success(null, 'All vehicles unassigned from route successfully');
    }
}
