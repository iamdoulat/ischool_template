<?php
namespace App\Http\Controllers\Api\v1\Hostel;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class HostelController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $hostels = Hostel::all();
        return $this->success($hostels, 'Hostels retrieved successfully');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:boys,girls,combine',
            'address' => 'nullable|string',
            'intake' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        $hostel = Hostel::create($request->all());
        return $this->success($hostel, 'Hostel created successfully', 201);
    }

    public function show(Hostel $hostel)
    {
        return $this->success($hostel, 'Hostel retrieved successfully');
    }

    public function update(Request $request, Hostel $hostel)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:boys,girls,combine',
            'address' => 'nullable|string',
            'intake' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        $hostel->update($request->all());
        return $this->success($hostel, 'Hostel updated successfully');
    }

    public function destroy(Hostel $hostel)
    {
        $hostel->delete();
        return $this->success(null, 'Hostel deleted successfully');
    }
}
