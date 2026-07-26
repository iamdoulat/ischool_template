<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\SystemSetting\GeneralSettingController;

Route::get('/system-setting/general-setting', [GeneralSettingController::class, 'index']);

Route::prefix('system-setting')->middleware('auth:sanctum')->group(function () {
    Route::post('/general-setting', [GeneralSettingController::class, 'update']);
});
