<?php

use App\Http\Controllers\Api\v1\SystemSetting\SystemFieldController;
use Illuminate\Support\Facades\Route;

// Public visibility map for portal / admission form.
Route::get('/system-setting/system-fields/public', [SystemFieldController::class, 'publicMap']);

Route::middleware('auth:sanctum')->prefix('system-setting/system-fields')->group(function () {
    Route::get('/', [SystemFieldController::class, 'index']);
    Route::post('/{id}/toggle', [SystemFieldController::class, 'toggle']);
});
