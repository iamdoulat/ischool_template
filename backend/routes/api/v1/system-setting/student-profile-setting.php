<?php

use App\Http\Controllers\Api\v1\SystemSetting\StudentProfileSettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting/student-profile-setting')->group(function () {
    Route::get('/', [StudentProfileSettingController::class, 'index']);
    Route::post('/update-profile-edit', [StudentProfileSettingController::class, 'updateProfileEdit']);
    Route::post('/update-widgets', [StudentProfileSettingController::class, 'updateWidgets']);
});
