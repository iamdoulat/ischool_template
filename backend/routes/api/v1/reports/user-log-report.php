<?php

use App\Http\Controllers\Api\v1\Reports\UserLogReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/user-log')->group(function () {
    Route::get('/', [UserLogReportController::class, 'getUserLogReport']);
    Route::post('clear', [UserLogReportController::class, 'clearUserLogReport']);
});
