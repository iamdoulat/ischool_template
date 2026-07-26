<?php

use App\Http\Controllers\Api\v1\Reports\AlumniReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/alumni')->group(function () {
    Route::get('criteria', [AlumniReportController::class, 'getCriteria']);
    Route::get('search', [AlumniReportController::class, 'getAlumniReport']);
});
