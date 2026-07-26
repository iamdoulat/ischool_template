<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\FeeCollection\FeeMasterController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('fees-masters/bulk-delete', [FeeMasterController::class, 'bulkDelete']);
    Route::apiResource('fees-masters', FeeMasterController::class);
});
