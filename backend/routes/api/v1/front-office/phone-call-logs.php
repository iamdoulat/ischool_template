<?php

use App\Http\Controllers\Api\v1\FrontOffice\PhoneCallLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('phone-call-logs/bulk-delete', [PhoneCallLogController::class, 'bulkDelete']);
    Route::apiResource('phone-call-logs', PhoneCallLogController::class);
});
