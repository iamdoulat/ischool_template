<?php

use App\Http\Controllers\Api\v1\FrontOffice\VisitorController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('visitors/bulk-delete', [VisitorController::class, 'bulkDelete']);
    Route::apiResource('visitors', VisitorController::class);
});
