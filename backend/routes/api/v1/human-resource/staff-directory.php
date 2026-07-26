<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\HumanResource\StaffController;
use App\Http\Controllers\Api\v1\HumanResource\DesignationController;
use App\Http\Controllers\Api\v1\HumanResource\DepartmentController;
use App\Http\Controllers\Api\v1\HumanResource\TeacherRatingController;
use App\Http\Controllers\Api\v1\HumanResource\LeaveTypeController;
use App\Http\Controllers\Api\v1\HumanResource\LeaveRequestController;
use App\Http\Controllers\Api\v1\HumanResource\PayrollController;

Route::prefix('hr')->middleware('auth:sanctum')->group(function () {
    Route::get('/staff-directory', [StaffController::class, 'index']);
    Route::post('/staff-directory', [StaffController::class, 'store']);
    Route::get('/next-staff-id', [StaffController::class, 'getNextStaffId']);
    Route::get('/staff-directory/next-id', [StaffController::class, 'getNextStaffId']);
    Route::get('/staff-directory/{id}', [StaffController::class, 'show']);
    Route::put('/staff-directory/{id}', [StaffController::class, 'update']);
    Route::delete('/staff-directory/{id}', [StaffController::class, 'destroy']);
    Route::post('/staff-directory/{id}/reset-password', [StaffController::class, 'sendPasswordResetLink']);
    Route::get('/staff-roles', [StaffController::class, 'getRoles']);
    
    Route::apiResource('designation', DesignationController::class);
    Route::apiResource('department', DepartmentController::class);
    Route::apiResource('leave-type', LeaveTypeController::class);
    Route::apiResource('leave-request', LeaveRequestController::class);
    
    Route::get('/teacher-ratings', [TeacherRatingController::class, 'index']);
    Route::post('/teacher-ratings', [TeacherRatingController::class, 'store']);
    Route::get('/teacher-ratings/{id}', [TeacherRatingController::class, 'show']);
    Route::delete('/teacher-ratings/{id}', [TeacherRatingController::class, 'destroy']);
    Route::put('/teacher-ratings/{id}/approve', [TeacherRatingController::class, 'approve']);

    Route::get('/payroll', [PayrollController::class, 'index']);
    Route::post('/payroll', [PayrollController::class, 'store']);
    Route::put('/payroll/{id}', [PayrollController::class, 'update']);
    Route::put('/payroll/{id}/pay', [PayrollController::class, 'pay']);

    Route::get('/staff-attendance', [\App\Http\Controllers\Api\v1\HumanResource\StaffAttendanceController::class, 'index']);
    Route::post('/staff-attendance', [\App\Http\Controllers\Api\v1\HumanResource\StaffAttendanceController::class, 'saveAttendance']);
});

