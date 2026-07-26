<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MarksGrade;

class MarksGradeController extends Controller
{
    public function index(Request $request)
    {
        $query = MarksGrade::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('exam_type', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->orderBy('exam_type')->orderBy('percent_from', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'exam_type' => 'required|string',
            'name' => 'required|string',
            'percent_from' => 'required|numeric|min:0|max:100',
            'percent_upto' => 'required|numeric|min:0|max:100',
            'grade_point' => 'required|numeric',
            'description' => 'nullable|string'
        ]);

        $marksGrade = MarksGrade::create($request->only([
            'exam_type',
            'name',
            'percent_from',
            'percent_upto',
            'grade_point',
            'description',
        ]));
        return response()->json(['message' => 'Marks grade created successfully', 'data' => $marksGrade]);
    }

    public function show($id)
    {
        return response()->json(MarksGrade::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'exam_type' => 'required|string',
            'name' => 'required|string',
            'percent_from' => 'required|numeric|min:0|max:100',
            'percent_upto' => 'required|numeric|min:0|max:100',
            'grade_point' => 'required|numeric',
            'description' => 'nullable|string'
        ]);

        $marksGrade = MarksGrade::findOrFail($id);
        $marksGrade->update($request->only([
            'exam_type',
            'name',
            'percent_from',
            'percent_upto',
            'grade_point',
            'description',
        ]));
        return response()->json(['message' => 'Marks grade updated successfully', 'data' => $marksGrade]);
    }

    public function destroy($id)
    {
        MarksGrade::findOrFail($id)->delete();
        return response()->json(['message' => 'Marks grade deleted successfully']);
    }
}
