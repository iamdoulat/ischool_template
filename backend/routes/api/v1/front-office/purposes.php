<?php

use App\Http\Controllers\Api\v1\FrontOffice\FrontOfficePurposeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('front-office-purposes/bulk-delete', [FrontOfficePurposeController::class, 'bulkDelete']);
    Route::apiResource('front-office-purposes', FrontOfficePurposeController::class);
});
