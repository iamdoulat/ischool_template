<?php

use App\Http\Controllers\Api\v1\StudentInformation\OnlineAdmissionController;
use Illuminate\Support\Facades\Route;

// Public routes (no auth required) — must be registered BEFORE wildcard {id} routes
Route::post('/online-admissions/apply', [OnlineAdmissionController::class, 'store']);
Route::get('/online-admissions/track/{reference_no}', [OnlineAdmissionController::class, 'track']);
Route::post('/online-admissions/{id}/process-payment', [OnlineAdmissionController::class, 'processPayment']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/online-admissions', [OnlineAdmissionController::class, 'index']);
    Route::get('/online-admissions/{id}', [OnlineAdmissionController::class, 'show']);
    Route::post('/online-admissions/{id}', [OnlineAdmissionController::class, 'update']); // Using POST for multipart/form-data support
    Route::put('/online-admissions/{id}/status', [OnlineAdmissionController::class, 'updateStatus']);
    Route::post('/online-admissions/{id}/enroll', [OnlineAdmissionController::class, 'enroll']);
    Route::delete('/online-admissions/{id}', [OnlineAdmissionController::class, 'destroy']);
});
