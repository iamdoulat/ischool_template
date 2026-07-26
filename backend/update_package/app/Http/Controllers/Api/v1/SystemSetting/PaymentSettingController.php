<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $settings = PaymentSetting::all();

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
            'provider' => 'required|string',
            'config' => 'nullable|array',
            'status' => 'nullable|boolean',
        ]);

        $setting = PaymentSetting::updateOrCreate(
            ['provider' => $validated['provider']],
            [
                'config' => $validated['config'] ?? [],
                'status' => $validated['status'] ?? true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Payment setting saved successfully',
            'data' => $setting
        ]);
    }
}
