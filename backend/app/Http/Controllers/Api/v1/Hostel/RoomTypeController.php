<?php

namespace App\Http\Controllers\Api\v1\Hostel;

use App\Http\Controllers\Controller;
use App\Models\RoomType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RoomTypeController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $roomTypes = RoomType::all();
        return $this->success($roomTypes, 'Room types retrieved successfully');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $roomType = RoomType::create($request->all());
        return $this->success($roomType, 'Room type created successfully', 201);
    }

    public function show(RoomType $roomType)
    {
        return $this->success($roomType, 'Room type retrieved successfully');
    }

    public function update(Request $request, RoomType $roomType)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $roomType->update($request->all());
        return $this->success($roomType, 'Room type updated successfully');
    }

    public function destroy(RoomType $roomType)
    {
        $roomType->delete();
        return $this->success(null, 'Room type deleted successfully');
    }
}
