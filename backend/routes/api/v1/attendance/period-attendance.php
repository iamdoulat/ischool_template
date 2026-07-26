<?php

use App\Http\Controllers\Api\v1\Attendance\PeriodAttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('attendance/period', [PeriodAttendanceController::class, 'index']);
    Route::post('attendance/period', [PeriodAttendanceController::class, 'store']);
    Route::get('attendance/period/subjects', [PeriodAttendanceController::class, 'getSubjects']);
    Route::get('attendance/period/report', [PeriodAttendanceController::class, 'reportByDate']);
});
