<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\FeeCollection\FeeTypeController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('fees-types/bulk-delete', [FeeTypeController::class, 'bulkDelete']);
    Route::apiResource('fees-types', FeeTypeController::class);
});
