<?php

namespace App\Http\Controllers\Api\v1\Certificate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StudentIdCard;

class StudentIdCardController extends Controller
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
        'show_admission_no',
        'show_student_name',
        'show_class',
        'show_father_name',
        'show_mother_name',
        'show_address',
        'show_phone',
        'show_dob',
        'show_blood_group',
        'show_qr',
        'show_roll_no',
        'show_house',
        'is_active',
    ];

    public function index(Request $request)
    {
        $query = StudentIdCard::query();

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $query->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate(['title' => 'required|string|max:255']);

        $card = StudentIdCard::create($request->only(self::ASSIGNABLE));

        return response()->json(['message' => 'Student ID card created successfully', 'data' => $card]);
    }

    public function show($id)
    {
        return response()->json(StudentIdCard::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate(['title' => 'required|string|max:255']);

        $card = StudentIdCard::findOrFail($id);
        $card->update($request->only(self::ASSIGNABLE));

        return response()->json(['message' => 'Student ID card updated successfully', 'data' => $card]);
    }

    public function destroy($id)
    {
        StudentIdCard::findOrFail($id)->delete();

        return response()->json(['message' => 'Student ID card deleted successfully']);
    }
}
