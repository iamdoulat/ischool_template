<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MarksheetTemplate;

class MarksheetTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = MarksheetTemplate::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $data = $request->only([
            'name',
            'exam_name',
            'school_name',
            'exam_center',
            'body_text',
            'footer_text',
            'printing_date',
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
            'show_exam_number',
            'show_admission_no',
            'show_division',
            'show_roll_no',
            'show_photo',
            'show_class',
            'show_section',
            'show_status',
            'show_remark',
            'is_active',
        ]);
        $template = MarksheetTemplate::create($data);
        return response()->json(['message' => 'Marksheet template created successfully', 'data' => $template]);
    }

    public function show($id)
    {
        return response()->json(MarksheetTemplate::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $template = MarksheetTemplate::findOrFail($id);
        $template->update($request->only([
            'name',
            'exam_name',
            'school_name',
            'exam_center',
            'body_text',
            'footer_text',
            'printing_date',
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
            'show_exam_number',
            'show_admission_no',
            'show_division',
            'show_roll_no',
            'show_photo',
            'show_class',
            'show_section',
            'show_status',
            'show_remark',
            'is_active',
        ]));
        return response()->json(['message' => 'Marksheet template updated successfully', 'data' => $template]);
    }

    public function destroy($id)
    {
        MarksheetTemplate::findOrFail($id)->delete();
        return response()->json(['message' => 'Marksheet template deleted successfully']);
    }
}
