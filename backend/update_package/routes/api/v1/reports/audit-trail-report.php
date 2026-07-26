<?php

use App\Http\Controllers\Api\v1\Reports\AuditTrailReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/audit-trail')->group(function () {
    Route::get('/', [AuditTrailReportController::class, 'getAuditTrailReport']);
    Route::post('clear', [AuditTrailReportController::class, 'clearAuditTrailReport']);
});
