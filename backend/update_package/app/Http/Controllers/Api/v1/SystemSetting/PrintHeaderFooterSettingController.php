<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\PrintHeaderFooterSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PrintHeaderFooterSettingController extends Controller
{
    /**
     * Get all print settings or a specific type
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');

        if ($type) {
            $setting = PrintHeaderFooterSetting::where('type', $type)->first();

            return response()->json([
                'status' => 'success',
                'data' => $setting ?? [
                    'type' => $type,
                    'header_image_url' => null,
                    'footer_content' => '',
                    'paper_size' => 'A4'
                ]
            ]);
        }

        // Return all settings
        $settings = PrintHeaderFooterSetting::all();

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Store or update print settings
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|max:255',
            'header_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'footer_content' => 'nullable|string|max:10000',
            'paper_size' => 'required|in:A4,A5,Legal',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();
        $type = $validated['type'];

        // Find existing setting
        $setting = PrintHeaderFooterSetting::where('type', $type)->first();

        $data = [
            'type' => $type,
            'footer_content' => $validated['footer_content'] ?? '',
            'paper_size' => $validated['paper_size'],
        ];

        // Handle image upload
        if ($request->hasFile('header_image')) {
            // Delete old image if exists
            if ($setting && $setting->header_image_path) {
                Storage::disk('public')->delete($setting->header_image_path);
            }

            // Store new image
            $imagePath = $request->file('header_image')->store('print-headers', 'public');
            $data['header_image_path'] = $imagePath;
        }

        // Update or create
        $setting = PrintHeaderFooterSetting::updateOrCreate(
            ['type' => $type],
            $data
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Print settings saved successfully',
            'data' => $setting
        ]);
    }

    /**
     * Delete a specific print setting
     */
    public function destroy(string $type): JsonResponse
    {
        $setting = PrintHeaderFooterSetting::where('type', $type)->first();

        if (!$setting) {
            return response()->json([
                'status' => 'error',
                'message' => 'Setting not found'
            ], 404);
        }

        // Delete image if exists
        if ($setting->header_image_path) {
            Storage::disk('public')->delete($setting->header_image_path);
        }

        $setting->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Print setting deleted successfully'
        ]);
    }

    /**
     * Delete only the header image for a specific type
     */
    public function deleteHeaderImage(string $type): JsonResponse
    {
        $setting = PrintHeaderFooterSetting::where('type', $type)->first();

        if (!$setting) {
            return response()->json([
                'status' => 'error',
                'message' => 'Setting not found'
            ], 404);
        }

        if ($setting->header_image_path) {
            Storage::disk('public')->delete($setting->header_image_path);
            $setting->header_image_path = null;
            $setting->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Header image deleted successfully',
            'data' => $setting
        ]);
    }

    /**
     * Reset all settings to default (clear all)
     */
    public function resetAll(): JsonResponse
    {
        $settings = PrintHeaderFooterSetting::all();

        foreach ($settings as $setting) {
            if ($setting->header_image_path) {
                Storage::disk('public')->delete($setting->header_image_path);
            }
        }

        PrintHeaderFooterSetting::truncate();

        return response()->json([
            'status' => 'success',
            'message' => 'All print settings have been reset'
        ]);
    }
}
