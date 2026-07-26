<?php

use App\Http\Controllers\Api\v1\StudentInformation\MultiClassStudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/multi-class-students', [MultiClassStudentController::class, 'index']);
    Route::post('/multi-class-students', [MultiClassStudentController::class, 'store']);
    Route::delete('/multi-class-students/{id}', [MultiClassStudentController::class, 'destroy']);
});
