<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\ThermalPrintSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ThermalPrintSettingController extends Controller
{
    /**
     * Get thermal print settings
     */
    public function index(): JsonResponse
    {
        $setting = ThermalPrintSetting::first();

        // Return default values if no settings exist
        if (!$setting) {
            $setting = [
                'status' => true,
                'school_name' => '',
                'address' => '',
                'footer_text' => '',
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $setting
        ]);
    }

    /**
     * Store or update thermal print settings
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|boolean',
            'school_name' => 'required|string|max:255',
            'address' => 'nullable|string|max:1000',
            'footer_text' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $setting = ThermalPrintSetting::updateOrCreate(
            ['id' => 1], // Single configuration for thermal print
            [
                'status' => $validated['status'],
                'school_name' => $validated['school_name'],
                'address' => $validated['address'] ?? '',
                'footer_text' => $validated['footer_text'] ?? '',
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Thermal print settings saved successfully',
            'data' => $setting
        ]);
    }

    /**
     * Reset to default settings
     */
    public function reset(): JsonResponse
    {
        $setting = ThermalPrintSetting::updateOrCreate(
            ['id' => 1],
            [
                'status' => true,
                'school_name' => 'Smart School Management System',
                'address' => '25 Kings Street, California<br>Phone: +1 (555) 123-4567<br>Email: info@smartschool.com',
                'footer_text' => 'This is a computer-generated receipt. No signature required.',
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Settings reset to defaults',
            'data' => $setting
        ]);
    }
}
