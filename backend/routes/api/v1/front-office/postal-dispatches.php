<?php

use App\Http\Controllers\Api\v1\FrontOffice\PostalDispatchController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('postal-dispatches/bulk-delete', [PostalDispatchController::class, 'bulkDelete']);
    Route::apiResource('postal-dispatches', PostalDispatchController::class);
});
