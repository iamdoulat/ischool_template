<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Api\BaseController;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends BaseController
{
    public function index()
    {
        $departments = Department::all();
        return $this->success($departments, 'Departments retrieved successfully.');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:departments,name',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $department = Department::create($request->only(['name']));
        return $this->success($department, 'Department created successfully.', 201);
    }

    public function show($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return $this->error('Department not found', 404);
        }
        return $this->success($department, 'Department retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $department = Department::find($id);
        if (!$department) {
            return $this->error('Department not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:departments,name,' . $id,
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $department->update($request->only(['name']));
        return $this->success($department, 'Department updated successfully.');
    }

    public function destroy($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return $this->error('Department not found', 404);
        }
        $department->delete();
        return $this->success(null, 'Department deleted successfully.');
    }
}
