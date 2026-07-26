<?php

use App\Http\Controllers\Api\v1\FeeCollection\FeeCollectionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('fee-collection/search-students', [FeeCollectionController::class, 'searchStudents']);
    Route::get('fee-collection/student-fees/{id}', [FeeCollectionController::class, 'getStudentFees']);
    Route::put('fee-collection/student-fees/{id}', [FeeCollectionController::class, 'updateStudentFee']);
    Route::delete('fee-collection/student-fees/{id}', [FeeCollectionController::class, 'deleteStudentFee']);
    Route::post('fee-collection/assign-manual-fee', [FeeCollectionController::class, 'assignManualFee']);
    Route::post('fee-collection/generate-manual-invoice', [FeeCollectionController::class, 'generateManualInvoice']);
    Route::get('fee-collection/manual-invoice/{id}', [FeeCollectionController::class, 'getManualInvoiceDetails']);
    Route::put('fee-collection/manual-invoice/{id}', [FeeCollectionController::class, 'updateManualInvoice']);
    Route::post('fee-collection/collect-fee', [FeeCollectionController::class, 'collectFee']);
    Route::get('fee-collection/search-payments', [FeeCollectionController::class, 'searchPayments']);
    Route::get('finance-reports/balance-fees-statement', [\App\Http\Controllers\Api\v1\Finance\FinanceReportController::class, 'balanceFeesStatement']);
    Route::get('finance-reports/daily-collection', [\App\Http\Controllers\Api\v1\Finance\FinanceReportController::class, 'dailyCollectionReport']);
    Route::get('finance-reports/fees-statement', [\App\Http\Controllers\Api\v1\Finance\FinanceReportController::class, 'feesStatement']);
});
