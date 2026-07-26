<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\FeeCollection\FeeGroupController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('fees-groups/bulk-delete', [FeeGroupController::class, 'bulkDelete']);
    Route::apiResource('fees-groups', FeeGroupController::class);
});
