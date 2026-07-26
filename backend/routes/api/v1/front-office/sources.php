<?php

use App\Http\Controllers\Api\v1\FrontOffice\FrontOfficeSourceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('front-office-sources/bulk-delete', [FrontOfficeSourceController::class, 'bulkDelete']);
    Route::apiResource('front-office-sources', FrontOfficeSourceController::class);
});
