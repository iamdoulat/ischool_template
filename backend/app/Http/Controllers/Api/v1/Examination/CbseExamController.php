<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CbseExam;
use App\Models\CbseExamCategory;

class CbseExamController extends Controller
{
    public function index(Request $request)
    {
        $query = CbseExam::with('category');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function getCriteria()
    {
        return response()->json([
            'categories' => CbseExamCategory::all()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'term' => 'required|string',
        ]);

        $exam = CbseExam::create($request->all());
        return response()->json(['message' => 'CBSE Exam created successfully', 'data' => $exam]);
    }

    public function show($id)
    {
        return response()->json(CbseExam::with('category')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $exam = CbseExam::findOrFail($id);
        $exam->update($request->all());
        return response()->json(['message' => 'CBSE Exam updated successfully', 'data' => $exam]);
    }

    public function destroy($id)
    {
        CbseExam::findOrFail($id)->delete();
        return response()->json(['message' => 'CBSE Exam deleted successfully']);
    }
}
