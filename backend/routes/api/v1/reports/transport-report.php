<?php

use App\Http\Controllers\Api\v1\Reports\TransportReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/transport')->group(function () {
    Route::get('/criteria', [TransportReportController::class, 'getCriteria']);
    Route::get('/search', [TransportReportController::class, 'getTransportReport']);
});
