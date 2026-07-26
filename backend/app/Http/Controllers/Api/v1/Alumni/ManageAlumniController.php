<?php

namespace App\Http\Controllers\Api\v1\Alumni;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class ManageAlumniController extends Controller
{
    public function index(Request $request)
    {
        $session_id = $request->get('session_id');
        $class_id = $request->get('class_id');
        $section_id = $request->get('section_id');
        $admission_no = $request->get('admission_no');

        $query = User::where('role', 'Student')
            ->with(['schoolClass', 'section', 'academicSession']);

        if ($admission_no) {
            $query->where('admission_no', 'like', "%{$admission_no}%");
        } else {
            if (!$session_id || !$class_id) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            $query->where('academic_session_id', $session_id)
                  ->where('school_class_id', $class_id);

            if ($section_id && $section_id !== 'all') {
                $query->where('section_id', $section_id);
            }
        }

        $students = $query->get();

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }
}
