<?php

use App\Http\Controllers\Api\v1\SystemSetting\PaymentGatewaySettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('system-setting')->group(function () {
    Route::get('payment-settings', [PaymentGatewaySettingController::class, 'index']);
    Route::get('payment-settings/{provider}', [PaymentGatewaySettingController::class, 'show']);
    Route::post('payment-settings', [PaymentGatewaySettingController::class, 'store']);
    Route::delete('payment-settings/{provider}', [PaymentGatewaySettingController::class, 'destroy']);
    Route::post('payment-settings/{provider}/toggle', [PaymentGatewaySettingController::class, 'toggleStatus']);
});
