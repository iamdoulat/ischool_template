<?php

namespace App\Http\Controllers\Api\v1\Behaviour;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BehaviourSetting;

class BehaviourSettingController extends Controller
{
    public function show()
    {
        return response()->json(BehaviourSetting::first());
    }

    public function update(Request $request)
    {
        $setting = BehaviourSetting::first();
        if (!$setting) {
            $setting = new BehaviourSetting();
        }
        
        $setting->update([
            'student_comment' => $request->boolean('student_comment'),
            'parent_comment' => $request->boolean('parent_comment'),
        ]);

        return response()->json(['message' => 'Behaviour settings updated successfully', 'data' => $setting]);
    }
}
