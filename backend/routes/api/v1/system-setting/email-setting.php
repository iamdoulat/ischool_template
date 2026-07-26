<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\SystemSetting\EmailSettingController;

Route::prefix('system-setting')->middleware('auth:sanctum')->group(function () {
    Route::get('/email-setting', [EmailSettingController::class, 'index']);
    Route::post('/email-setting', [EmailSettingController::class, 'update']);
    Route::post('/email-setting/test', [EmailSettingController::class, 'testEmail']);
});
