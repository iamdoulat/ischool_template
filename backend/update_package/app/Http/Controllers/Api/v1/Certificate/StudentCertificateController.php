<?php

namespace App\Http\Controllers\Api\v1\Certificate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StudentCertificate;

class StudentCertificateController extends Controller
{
    private const ASSIGNABLE = [
        'name',
        'header_left',
        'header_center',
        'header_right',
        'body_text',
        'footer_left',
        'footer_center',
        'footer_right',
        'header_height',
        'footer_height',
        'body_height',
        'body_width',
        'enable_student_photo',
        'background_image',
        'is_active',
    ];

    public function index(Request $request)
    {
        $query = StudentCertificate::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $query->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $certificate = StudentCertificate::create($request->only(self::ASSIGNABLE));

        return response()->json(['message' => 'Student certificate created successfully', 'data' => $certificate]);
    }

    public function show($id)
    {
        return response()->json(StudentCertificate::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $certificate = StudentCertificate::findOrFail($id);
        $certificate->update($request->only(self::ASSIGNABLE));

        return response()->json(['message' => 'Student certificate updated successfully', 'data' => $certificate]);
    }

    public function destroy($id)
    {
        StudentCertificate::findOrFail($id)->delete();

        return response()->json(['message' => 'Student certificate deleted successfully']);
    }
}
