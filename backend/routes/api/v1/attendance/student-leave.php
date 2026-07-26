<?php

use App\Http\Controllers\Api\v1\Attendance\StudentLeaveController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('attendance/approve-leave/check', [StudentLeaveController::class, 'checkExisting']);
    Route::get('attendance/approve-leave', [StudentLeaveController::class, 'index']);
    Route::post('attendance/approve-leave', [StudentLeaveController::class, 'store']);
    Route::put('attendance/approve-leave/{id}', [StudentLeaveController::class, 'update']);
    Route::put('attendance/approve-leave/{id}/status', [StudentLeaveController::class, 'updateStatus']);
    Route::delete('attendance/approve-leave/{id}', [StudentLeaveController::class, 'destroy']);
});
