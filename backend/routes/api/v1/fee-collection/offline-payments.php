<?php

use App\Http\Controllers\Api\v1\FeeCollection\OfflineBankPaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('fee-collection/offline-payments', [OfflineBankPaymentController::class, 'index']);
    Route::post('fee-collection/offline-payments/{offlineBankPayment}/approve', [OfflineBankPaymentController::class, 'approve']);
    Route::post('fee-collection/offline-payments/{offlineBankPayment}/reject', [OfflineBankPaymentController::class, 'reject']);
    Route::delete('fee-collection/offline-payments/{offlineBankPayment}', [OfflineBankPaymentController::class, 'destroy']);
});
