<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewaySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentGatewaySettingController extends Controller
{
    /**
     * Get all payment gateway settings
     */
    public function index(): JsonResponse
    {
        $settings = PaymentGatewaySetting::all();

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Get specific payment gateway setting
     */
    public function show(string $provider): JsonResponse
    {
        $setting = PaymentGatewaySetting::where('provider', $provider)->first();

        if (!$setting) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'provider' => $provider,
                    'config' => [],
                    'status' => false
                ]
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $setting
        ]);
    }

    /**
     * Store or update payment gateway setting
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string|max:255',
            'config' => 'nullable|array',
            'status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        $setting = PaymentGatewaySetting::updateOrCreate(
            ['provider' => $validated['provider']],
            [
                'config' => $validated['config'] ?? [],
                'status' => $validated['status'],
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Payment gateway settings saved successfully',
            'data' => $setting
        ]);
    }

    /**
     * Delete a payment gateway setting
     */
    public function destroy(string $provider): JsonResponse
    {
        $setting = PaymentGatewaySetting::where('provider', $provider)->first();

        if (!$setting) {
            return response()->json([
                'status' => 'error',
                'message' => 'Setting not found'
            ], 404);
        }

        $setting->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Payment gateway setting deleted successfully'
        ]);
    }

    /**
     * Toggle payment gateway status
     */
    public function toggleStatus(string $provider): JsonResponse
    {
        $setting = PaymentGatewaySetting::where('provider', $provider)->first();

        if (!$setting) {
            return response()->json([
                'status' => 'error',
                'message' => 'Setting not found'
            ], 404);
        }

        $setting->status = !$setting->status;
        $setting->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status updated successfully',
            'data' => $setting
        ]);
    }
}
