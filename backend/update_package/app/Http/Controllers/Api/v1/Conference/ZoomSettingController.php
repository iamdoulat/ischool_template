<?php

namespace App\Http\Controllers\Api\v1\Conference;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ZoomSetting;

class ZoomSettingController extends Controller
{
    public function index()
    {
        $setting = ZoomSetting::first();
        if (!$setting) {
            $setting = ZoomSetting::create([
                'api_key' => 's4aABluGRXK5kj5JM1UQtg',
                'api_secret' => 'w0ELxqU7WGzH4q3knJ2Yh5DfAqRvBypB',
                'teacher_api_credential' => true,
                'staff_client_type' => 'web',
                'student_client_type' => 'web',
                'parent_live_class' => true,
            ]);
        }
        return response()->json($setting);
    }

    public function update(Request $request)
    {
        $setting = ZoomSetting::first();
        if (!$setting) {
            $setting = new ZoomSetting();
        }
        
        $setting->update($request->all());
        
        return response()->json(['message' => 'Zoom settings updated successfully', 'data' => $setting]);
    }
}
