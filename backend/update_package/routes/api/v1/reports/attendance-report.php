<?php

use App\Http\Controllers\Api\v1\Reports\AttendanceReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('reports/attendance/student', [AttendanceReportController::class, 'studentAttendanceReport']);
    Route::get('reports/attendance/student-day-wise', [AttendanceReportController::class, 'studentDayWiseReport']);
    // Alias for the "Student Attendance Type Report" tab (filters by attendance_type + search_type period)
    Route::get('reports/attendance/day-wise', [AttendanceReportController::class, 'studentDayWiseReport']);
    Route::get('reports/attendance/daily', [AttendanceReportController::class, 'dailyAttendanceReport']);
    Route::get('reports/attendance/staff', [AttendanceReportController::class, 'staffAttendanceReport']);
    Route::get('reports/attendance/staff-day-wise', [AttendanceReportController::class, 'staffDayWiseReport']);
    Route::get('reports/attendance/biometric', [AttendanceReportController::class, 'biometricAttendanceLog']);
});
