<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Api\BaseController;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DesignationController extends BaseController
{
    public function index()
    {
        $designations = Designation::all();
        return $this->success($designations, 'Designations retrieved successfully.');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:designations,name',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $designation = Designation::create($request->only(['name']));
        return $this->success($designation, 'Designation created successfully.', 201);
    }

    public function show($id)
    {
        $designation = Designation::find($id);
        if (!$designation) {
            return $this->error('Designation not found', 404);
        }
        return $this->success($designation, 'Designation retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $designation = Designation::find($id);
        if (!$designation) {
            return $this->error('Designation not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:designations,name,' . $id,
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $designation->update($request->only(['name']));
        return $this->success($designation, 'Designation updated successfully.');
    }

    public function destroy($id)
    {
        $designation = Designation::find($id);
        if (!$designation) {
            return $this->error('Designation not found', 404);
        }
        $designation->delete();
        return $this->success(null, 'Designation deleted successfully.');
    }
}
