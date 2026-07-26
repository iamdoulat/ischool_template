<?php

use App\Http\Controllers\Api\v1\Attendance\StudentAttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('attendance/student', [StudentAttendanceController::class, 'index']);
    Route::post('attendance/student', [StudentAttendanceController::class, 'store']);
});
