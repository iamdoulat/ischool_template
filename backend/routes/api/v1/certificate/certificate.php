<?php

use App\Http\Controllers\Api\v1\Certificate\StudentCertificateController;
use App\Http\Controllers\Api\v1\Certificate\StudentIdCardController;
use App\Http\Controllers\Api\v1\Certificate\StaffIdCardController;
use App\Http\Controllers\Api\v1\Certificate\TransferCertificateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('certificate/student-certificates', StudentCertificateController::class);
    Route::apiResource('certificate/student-id-cards', StudentIdCardController::class);
    Route::apiResource('certificate/staff-id-cards', StaffIdCardController::class);

    // Transfer Certificates — verify must come before the resource to avoid binding {id}='verify'
    Route::get('certificate/transfer-certificates/verify', [TransferCertificateController::class, 'verify']);
    Route::apiResource('certificate/transfer-certificates', TransferCertificateController::class)
        ->except(['update']);
});
