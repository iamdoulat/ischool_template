<?php

use App\Http\Controllers\Api\v1\Reports\HostelReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/hostel')->group(function () {
    Route::get('criteria', [HostelReportController::class, 'getCriteria']);
    Route::get('search', [HostelReportController::class, 'getHostelReport']);
});
