<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AdmitCardTemplate;

class AdmitCardTemplateController extends Controller
{
    /**
     * Columns accepted from the request. Mirrors AdmitCardTemplate::$fillable
     * and matches exactly the fields the design-admit-card form submits.
     */
    private const ASSIGNABLE = [
        'name',
        'heading',
        'title',
        'exam_name',
        'school_name',
        'exam_center',
        'footer_text',
        'header_image',
        'left_logo',
        'right_logo',
        'left_sign',
        'middle_sign',
        'right_sign',
        'background_image',
        'show_name',
        'show_father_name',
        'show_mother_name',
        'show_dob',
        'show_admission_no',
        'show_roll_no',
        'show_address',
        'show_gender',
        'show_photo',
        'show_class',
        'show_section',
        'show_exam_number',
        'is_active',
    ];

    public function index(Request $request)
    {
        $query = AdmitCardTemplate::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $template = AdmitCardTemplate::create($request->only(self::ASSIGNABLE));
        return response()->json(['message' => 'Admit card template created successfully', 'data' => $template]);
    }

    public function show($id)
    {
        return response()->json(AdmitCardTemplate::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $template = AdmitCardTemplate::findOrFail($id);
        $template->update($request->only(self::ASSIGNABLE));
        return response()->json(['message' => 'Admit card template updated successfully', 'data' => $template]);
    }

    public function destroy($id)
    {
        AdmitCardTemplate::findOrFail($id)->delete();
        return response()->json(['message' => 'Admit card template deleted successfully']);
    }
}
