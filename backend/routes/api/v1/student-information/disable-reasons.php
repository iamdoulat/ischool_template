<?php

use App\Http\Controllers\Api\v1\StudentInformation\DisableReasonController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('disable-reasons/bulk-delete', [DisableReasonController::class, 'bulkDelete']);
    Route::apiResource('disable-reasons', DisableReasonController::class);
});
