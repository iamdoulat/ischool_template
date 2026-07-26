<?php

namespace App\Http\Controllers\Api\v1\Certificate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StaffIdCard;

class StaffIdCardController extends Controller
{
    private const ASSIGNABLE = [
        'title',
        'school_name',
        'school_address',
        'header_color',
        'background_image',
        'logo',
        'signature',
        'design_type',
        'show_staff_name',
        'show_staff_id',
        'show_designation',
        'show_department',
        'show_father_name',
        'show_mother_name',
        'show_joining_date',
        'show_address',
        'show_phone',
        'show_dob',
        'show_qr',
        'is_active',
    ];

    public function index(Request $request)
    {
        $query = StaffIdCard::query();

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $query->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate(['title' => 'required|string|max:255']);

        $card = StaffIdCard::create($request->only(self::ASSIGNABLE));

        return response()->json(['message' => 'Staff ID card created successfully', 'data' => $card]);
    }

    public function show($id)
    {
        return response()->json(StaffIdCard::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate(['title' => 'required|string|max:255']);

        $card = StaffIdCard::findOrFail($id);
        $card->update($request->only(self::ASSIGNABLE));

        return response()->json(['message' => 'Staff ID card updated successfully', 'data' => $card]);
    }

    public function destroy($id)
    {
        StaffIdCard::findOrFail($id)->delete();

        return response()->json(['message' => 'Staff ID card deleted successfully']);
    }
}
