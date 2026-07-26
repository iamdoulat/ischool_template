<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\SystemSetting\SystemUpdateController;

Route::prefix('system-setting')->middleware('auth:sanctum')->group(function () {
    Route::get('/system-update', [SystemUpdateController::class, 'index']);
    Route::post('/system-update/check', [SystemUpdateController::class, 'check']);
    Route::post('/system-update/upload', [SystemUpdateController::class, 'upload']);
    Route::post('/system-update/install-remote', [SystemUpdateController::class, 'installRemote']);
});
