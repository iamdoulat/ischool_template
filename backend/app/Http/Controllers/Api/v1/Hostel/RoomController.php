<?php

namespace App\Http\Controllers\Api\v1\Hostel;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $rooms = Room::with(['hostel', 'roomType'])->get();
        return $this->success($rooms, 'Rooms retrieved successfully');
    }

    public function store(Request $request)
    {
        $request->validate([
            'room_number' => 'required|string|max:255',
            'hostel_id' => 'required|exists:hostels,id',
            'room_type_id' => 'required|exists:room_types,id',
            'number_of_bed' => 'required|integer',
            'cost_per_bed' => 'required|numeric',
        ]);

        $room = Room::create($request->all());
        return $this->success($room->load(['hostel', 'roomType']), 'Room created successfully', 201);
    }

    public function show(Room $room)
    {
        return $this->success($room->load(['hostel', 'roomType']), 'Room retrieved successfully');
    }

    public function update(Request $request, Room $room)
    {
        $request->validate([
            'room_number' => 'required|string|max:255',
            'hostel_id' => 'required|exists:hostels,id',
            'room_type_id' => 'required|exists:room_types,id',
            'number_of_bed' => 'required|integer',
            'cost_per_bed' => 'required|numeric',
        ]);

        $room->update($request->all());
        return $this->success($room->load(['hostel', 'roomType']), 'Room updated successfully');
    }

    public function destroy(Room $room)
    {
        $room->delete();
        return $this->success(null, 'Room deleted successfully');
    }
}
