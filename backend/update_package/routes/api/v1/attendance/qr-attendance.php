<?php

use App\Http\Controllers\Api\v1\Attendance\QrAttendanceSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('attendance/qr-settings', [QrAttendanceSettingController::class, 'index']);
    Route::post('attendance/qr-settings', [QrAttendanceSettingController::class, 'update']);
    Route::post('attendance/qr-scan', [\App\Http\Controllers\Api\v1\Attendance\QrAttendanceController::class, 'processScan']);
    Route::get('attendance/face-users', [\App\Http\Controllers\Api\v1\Attendance\FaceRegistrationController::class, 'getUsers']);
    Route::post('attendance/face-register', [\App\Http\Controllers\Api\v1\Attendance\FaceRegistrationController::class, 'registerFace']);
    Route::get('attendance/face-descriptors', [\App\Http\Controllers\Api\v1\Attendance\FaceRegistrationController::class, 'getRegisteredFaces']);
    Route::post('attendance/discover-cameras', [QrAttendanceSettingController::class, 'discoverCameras']);
});
