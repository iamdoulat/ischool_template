<?php

use App\Http\Controllers\Api\v1\SystemSetting\PrintHeaderFooterSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('system-setting')->group(function () {
    Route::get('print-settings', [PrintHeaderFooterSettingController::class, 'index']);
    Route::post('print-settings', [PrintHeaderFooterSettingController::class, 'store']);
    Route::delete('print-settings/{type}', [PrintHeaderFooterSettingController::class, 'destroy']);
    Route::delete('print-settings/{type}/header-image', [PrintHeaderFooterSettingController::class, 'deleteHeaderImage']);
    Route::post('print-settings/reset-all', [PrintHeaderFooterSettingController::class, 'resetAll']);
});
