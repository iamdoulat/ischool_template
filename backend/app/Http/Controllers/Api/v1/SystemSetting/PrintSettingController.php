<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\PrintSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PrintSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $settings = PrintSetting::all();

        // Append full URL paths for the images if they exist
        $settings->transform(function ($setting) {
            if ($setting->header_image) {
                $setting->header_image_url = Storage::disk('public')->url($setting->header_image);
            }
            return $setting;
        });

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Store a newly created resource in storage or update an existing one.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'footer_content' => 'nullable|string',
            'header_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:4096',
        ]);

        $setting = PrintSetting::where('type', $validated['type'])->first() ?? new PrintSetting(['type' => $validated['type']]);

        // Keep track of the current image to delete if it's being replaced
        $oldImage = $setting->header_image;

        if ($request->hasFile('header_image')) {
            $imagePath = $request->file('header_image')->store('print_settings', 'public');
            $setting->header_image = $imagePath;

            // Delete old image if a new one is uploaded
            if ($oldImage && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->has('footer_content')) {
            $setting->footer_content = $validated['footer_content'];
        }

        $setting->save();

        if ($setting->header_image) {
            $setting->header_image_url = Storage::disk('public')->url($setting->header_image);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Print setting saved successfully',
            'data' => $setting
        ]);
    }
}
