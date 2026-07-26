<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Api\BaseController;
use App\Models\ExamType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExamTypeController extends BaseController
{
    public function index()
    {
        $examTypes = ExamType::orderBy('name')->get();
        return $this->success($examTypes, 'Exam types retrieved successfully.');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:exam_types,name',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $examType = ExamType::create($request->only(['name']));
        return $this->success($examType, 'Exam type created successfully.', 201);
    }

    public function show($id)
    {
        $examType = ExamType::find($id);
        if (!$examType) {
            return $this->error('Exam type not found', 404);
        }
        return $this->success($examType, 'Exam type retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $examType = ExamType::find($id);
        if (!$examType) {
            return $this->error('Exam type not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:exam_types,name,' . $id,
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $examType->update($request->only(['name']));
        return $this->success($examType, 'Exam type updated successfully.');
    }

    public function destroy($id)
    {
        $examType = ExamType::find($id);
        if (!$examType) {
            return $this->error('Exam type not found', 404);
        }
        $examType->delete();
        return $this->success(null, 'Exam type deleted successfully.');
    }
}
