<?php

use App\Http\Controllers\Api\v1\SystemSetting\OnlineAdmissionController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting/online-admission')->group(function () {
    Route::get('/', [OnlineAdmissionController::class, 'index']);
    Route::post('settings', [OnlineAdmissionController::class, 'updateSettings']);
    Route::post('fields', [OnlineAdmissionController::class, 'updateFields']);
});
