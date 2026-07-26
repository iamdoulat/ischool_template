<?php

use App\Http\Controllers\Api\v1\SystemSetting\ThermalPrintSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('system-setting')->group(function () {
    Route::get('thermal-print-settings', [ThermalPrintSettingController::class, 'index']);
    Route::post('thermal-print-settings', [ThermalPrintSettingController::class, 'store']);
    Route::post('thermal-print-settings/reset', [ThermalPrintSettingController::class, 'reset']);
});
