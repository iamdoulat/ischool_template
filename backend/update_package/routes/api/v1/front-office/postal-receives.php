<?php

use App\Http\Controllers\Api\v1\FrontOffice\PostalReceiveController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('postal-receives/bulk-delete', [PostalReceiveController::class, 'bulkDelete']);
    Route::apiResource('postal-receives', PostalReceiveController::class);
});
