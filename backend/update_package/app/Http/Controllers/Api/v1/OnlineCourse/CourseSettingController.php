<?php

namespace App\Http\Controllers\Api\v1\OnlineCourse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CourseSetting;

class CourseSettingController extends Controller
{
    public function show()
    {
        return response()->json(CourseSetting::first());
    }

    public function update(Request $request)
    {
        $setting = CourseSetting::first();
        if (!$setting) {
            $setting = new CourseSetting();
        }

        $setting->fill($request->all());
        $setting->save();

        return response()->json(['message' => 'Course settings updated successfully', 'data' => $setting]);
    }
}
