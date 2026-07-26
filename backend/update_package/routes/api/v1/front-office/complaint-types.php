<?php

use App\Http\Controllers\Api\v1\FrontOffice\ComplaintTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('complaint-types/bulk-delete', [ComplaintTypeController::class, 'bulkDelete']);
    Route::apiResource('complaint-types', ComplaintTypeController::class);
});
