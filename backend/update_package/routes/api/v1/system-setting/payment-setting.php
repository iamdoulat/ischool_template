<?php

use App\Http\Controllers\Api\v1\SystemSetting\PaymentSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/payment-settings', [PaymentSettingController::class, 'index']);
    Route::post('/payment-settings', [PaymentSettingController::class, 'store']);
});
