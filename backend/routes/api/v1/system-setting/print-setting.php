<?php

use App\Http\Controllers\Api\v1\SystemSetting\PrintSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('system-setting')->group(function () {
    Route::get('print-settings', [PrintSettingController::class, 'index']);
    Route::post('print-settings', [PrintSettingController::class, 'store']);
});
