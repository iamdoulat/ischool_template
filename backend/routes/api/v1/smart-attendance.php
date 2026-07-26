<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\SmartAttendanceController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/smart-attendance/settings', [SmartAttendanceController::class, 'getSettings']);
    Route::post('/smart-attendance/settings', [SmartAttendanceController::class, 'updateSettings']);
    Route::post('/smart-attendance/mark', [SmartAttendanceController::class, 'markAttendance']);
    Route::get('/smart-attendance/records', [SmartAttendanceController::class, 'getRecords']);
    Route::get('/smart-attendance/users', [SmartAttendanceController::class, 'getUsers']);
    Route::post('/smart-attendance/generate-qr', [SmartAttendanceController::class, 'generateQrCode']);
    Route::post('/smart-attendance/delete-qr', [SmartAttendanceController::class, 'deleteQrCode']);
    Route::post('/smart-attendance/assign-nfc', [SmartAttendanceController::class, 'assignNfcTag']);
    Route::post('/smart-attendance/remove-nfc', [SmartAttendanceController::class, 'removeNfcTag']);
    Route::post('/smart-attendance/lookup-by-qr', [SmartAttendanceController::class, 'lookupByQr']);
    Route::post('/smart-attendance/lookup-by-nfc', [SmartAttendanceController::class, 'lookupByNfc']);
});
