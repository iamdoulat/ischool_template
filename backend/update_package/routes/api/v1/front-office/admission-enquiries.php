<?php

use App\Http\Controllers\Api\v1\FrontOffice\AdmissionEnquiryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('admission-enquiries/bulk-delete', [AdmissionEnquiryController::class, 'bulkDelete']);
    Route::apiResource('admission-enquiries', AdmissionEnquiryController::class);
});
