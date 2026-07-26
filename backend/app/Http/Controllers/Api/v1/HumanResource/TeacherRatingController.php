<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Api\BaseController;
use App\Models\TeacherRating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherRatingController extends BaseController
{
    public function index()
    {
        $ratings = TeacherRating::all();
        return $this->success($ratings, 'Teacher ratings retrieved successfully.');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|string',
            'staff_name' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'status' => 'nullable|in:Pending,Approved',
            'student_name' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $rating = TeacherRating::create($request->only([
            'staff_id',
            'staff_name',
            'rating',
            'comment',
            'status',
            'student_name',
        ]));
        return $this->success($rating, 'Teacher rating created successfully.', 201);
    }

    public function show($id)
    {
        $rating = TeacherRating::find($id);
        if (!$rating) {
            return $this->error('Teacher rating not found', 404);
        }
        return $this->success($rating, 'Teacher rating retrieved successfully.');
    }

    public function approve($id)
    {
        $rating = TeacherRating::find($id);
        if (!$rating) {
            return $this->error('Teacher rating not found', 404);
        }

        $rating->status = 'Approved';
        $rating->save();

        return $this->success($rating, 'Teacher rating approved successfully.');
    }

    public function destroy($id)
    {
        $rating = TeacherRating::find($id);
        if (!$rating) {
            return $this->error('Teacher rating not found', 404);
        }
        $rating->delete();
        return $this->success(null, 'Teacher rating deleted successfully.');
    }
}
