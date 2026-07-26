<?php

namespace App\Http\Controllers\Api\v1\Conference;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GmeetSetting;

class GmeetSettingController extends Controller
{
    public function index()
    {
        // Seed first settings record if empty to match image keys perfectly
        if (GmeetSetting::count() === 0) {
            GmeetSetting::create([
                'api_key' => '988720996993-ctjb5ibg56b45fu505l3lv310bv55d79.apps.googleusercontent.com',
                'api_secret' => 'XkSqRpcFacU2GG6QqCZPBkVP',
                'use_calendar_api' => false,
                'forgot_live_class' => false,
            ]);
        }

        return response()->json(GmeetSetting::first());
    }

    public function update(Request $request)
    {
        $setting = GmeetSetting::first() ?? new GmeetSetting();
        $setting->fill($request->all());
        $setting->save();
        
        return response()->json(['message' => 'Settings updated successfully', 'data' => $setting]);
    }
}
