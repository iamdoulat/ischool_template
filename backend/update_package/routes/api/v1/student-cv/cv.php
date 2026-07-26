<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\StudentInformation\StudentCvController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('student-cv/criteria', [StudentCvController::class, 'criteria']);
    Route::get('student-cv/students', [StudentCvController::class, 'index']);
    Route::get('student-cv/detail/{id}', [StudentCvController::class, 'detail']);
    Route::delete('student-cv/students/{id}', [StudentCvController::class, 'destroy']);
    
    // CV Settings routes
    Route::get('student-cv/settings', [StudentCvController::class, 'getSettings']);
    Route::post('student-cv/settings/toggle', [StudentCvController::class, 'toggleSetting']);
});
