<?php

use App\Http\Controllers\Api\v1\FrontOffice\FrontOfficeReferenceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('front-office-references/bulk-delete', [FrontOfficeReferenceController::class, 'bulkDelete']);
    Route::apiResource('front-office-references', FrontOfficeReferenceController::class);
});
