<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\TransportRoute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RouteController extends BaseController
{
    public function index()
    {
        $routes = TransportRoute::all();
        return $this->success($routes, 'Routes retrieved successfully');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $route = TransportRoute::create($request->all());
        return $this->success($route, 'Route created successfully', 201);
    }

    public function show($id)
    {
        $route = TransportRoute::find($id);
        if (!$route) {
            return $this->error('Route not found', 404);
        }
        return $this->success($route, 'Route retrieved successfully');
    }

    public function update(Request $request, $id)
    {
        $route = TransportRoute::find($id);
        if (!$route) {
            return $this->error('Route not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $route->update($request->all());
        return $this->success($route, 'Route updated successfully');
    }

    public function destroy($id)
    {
        $route = TransportRoute::find($id);
        if (!$route) {
            return $this->error('Route not found', 404);
        }

        $route->delete();
        return $this->success(null, 'Route deleted successfully');
    }
}
