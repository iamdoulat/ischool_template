<?php

use App\Http\Controllers\Api\v1\SystemSetting\FileTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('system-setting/file-types')->group(function () {
    Route::get('/', [FileTypeController::class, 'index']);
    Route::post('/', [FileTypeController::class, 'update']);
});
