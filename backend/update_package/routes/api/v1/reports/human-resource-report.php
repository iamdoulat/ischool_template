<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Reports\HumanResourceReportController;

Route::prefix('reports/human-resource')->group(function () {
    Route::get('/criteria', [HumanResourceReportController::class, 'getCriteriaData']);
    Route::get('/report', [HumanResourceReportController::class, 'getStaffReport']);
    Route::get('/payroll', [HumanResourceReportController::class, 'getPayrollReport']);
    Route::get('/leave', [HumanResourceReportController::class, 'getLeaveRequestReport']);
    Route::get('/my-leave', [HumanResourceReportController::class, 'getMyLeaveRequestReport']);
});
