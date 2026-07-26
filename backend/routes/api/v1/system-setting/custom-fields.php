<?php

use App\Http\Controllers\Api\v1\SystemSetting\CustomFieldController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('system-setting/custom-fields')->group(function () {
    Route::get('/', [CustomFieldController::class, 'index']);
    Route::post('/', [CustomFieldController::class, 'store']);
    Route::put('/{id}', [CustomFieldController::class, 'update']);
    Route::delete('/{id}', [CustomFieldController::class, 'destroy']);
});
