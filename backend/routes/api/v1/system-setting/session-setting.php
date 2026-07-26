<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\SystemSetting\SessionSettingController;

// Public: anyone can view sessions
Route::get('/system-setting/sessions', [SessionSettingController::class, 'index']);

Route::prefix('system-setting')->middleware('auth:sanctum')->group(function () {
    Route::post('/sessions', [SessionSettingController::class, 'store']);
    Route::put('/sessions/{id}', [SessionSettingController::class, 'update']);
    Route::delete('/sessions/{id}', [SessionSettingController::class, 'destroy']);
});
