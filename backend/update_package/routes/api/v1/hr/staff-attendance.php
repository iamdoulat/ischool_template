<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\HumanResource\StaffAttendanceController;

Route::prefix('hr')->group(function () {
    Route::get('/staff-attendance', [StaffAttendanceController::class, 'getStaff']);
    Route::post('/staff-attendance', [StaffAttendanceController::class, 'saveAttendance']);
});
