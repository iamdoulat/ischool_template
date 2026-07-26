<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\FrontCmsSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FrontCmsSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = FrontCmsSetting::first();

        if ($setting) {
            if ($setting->logo) {
                $setting->logo_url = Storage::url($setting->logo);
            }
            if ($setting->favicon) {
                $setting->favicon_url = Storage::url($setting->favicon);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $setting
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Decode JSON strings for array fields (since multipart/form-data sends everything as strings)
        if ($request->has('sidebar_options') && is_string($request->sidebar_options)) {
            $request->merge(['sidebar_options' => json_decode($request->sidebar_options, true)]);
        }
        if ($request->has('social_media') && is_string($request->social_media)) {
            $request->merge(['social_media' => json_decode($request->social_media, true)]);
        }
        if ($request->has('about_us') && is_string($request->about_us)) {
            $request->merge(['about_us' => json_decode($request->about_us, true)]);
        }
        if ($request->has('main_courses') && is_string($request->main_courses)) {
            $request->merge(['main_courses' => json_decode($request->main_courses, true)]);
        }
        if ($request->has('experienced_staffs') && is_string($request->experienced_staffs)) {
            $request->merge(['experienced_staffs' => json_decode($request->experienced_staffs, true)]);
        }
        if ($request->has('latest_notices') && is_string($request->latest_notices)) {
            $request->merge(['latest_notices' => json_decode($request->latest_notices, true)]);
        }
        if ($request->has('header_footer_sections') && is_string($request->header_footer_sections)) {
            $request->merge(['header_footer_sections' => json_decode($request->header_footer_sections, true)]);
        }

        $validated = $request->validate([
            'is_active' => 'nullable|boolean',
            'sidebar_active' => 'nullable|boolean',
            'rtl_mode' => 'nullable|boolean',
            'sidebar_options' => 'nullable|array',
            'language' => 'nullable|string',
            'footer_text' => 'nullable|string',
            'cookie_consent' => 'nullable|string',
            'google_analytics' => 'nullable|string',
            'social_media' => 'nullable|array',
            'current_theme' => 'nullable|string',
            'about_us' => 'nullable|array',
            'main_courses' => 'nullable|array',
            'experienced_staffs' => 'nullable|array',
            'latest_notices' => 'nullable|array',
            'header_footer_sections' => 'nullable|array',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'favicon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:1024',
        ]);

        $setting = FrontCmsSetting::first() ?? new FrontCmsSetting();

        // Handle File Uploads
        if ($request->hasFile('logo')) {
            if ($setting->logo) {
                Storage::disk('public')->delete($setting->logo);
            }
            $setting->logo = $request->file('logo')->store('front_cms/logos', 'public');
        }

        if ($request->hasFile('favicon')) {
            if ($setting->favicon) {
                Storage::disk('public')->delete($setting->favicon);
            }
            $setting->favicon = $request->file('favicon')->store('front_cms/favicons', 'public');
        }

        // Fill other properties
        $setting->fill($request->except(['logo', 'favicon']));
        $setting->save();

        if ($setting->logo) {
            $setting->logo_url = Storage::url($setting->logo);
        }
        if ($setting->favicon) {
            $setting->favicon_url = Storage::url($setting->favicon);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Front CMS settings saved successfully',
            'data' => $setting
        ]);
    }
}
