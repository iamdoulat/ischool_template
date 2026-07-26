<?php

use App\Http\Controllers\Api\v1\FrontOffice\ComplaintController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('complaints/bulk-delete', [ComplaintController::class, 'bulkDelete']);
    Route::apiResource('complaints', ComplaintController::class);
});
