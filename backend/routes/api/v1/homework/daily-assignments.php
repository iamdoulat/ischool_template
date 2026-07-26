<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Homework\DailyAssignmentController;
use App\Http\Controllers\Api\v1\Homework\HomeworkController;
use App\Http\Controllers\Api\v1\Homework\HomeworkSubmissionController;

Route::middleware('auth:sanctum')->group(function () {
    // Daily assignments CRUD + evaluate action
    Route::apiResource('homework/daily-assignments', DailyAssignmentController::class);
    Route::post('homework/daily-assignments/{dailyAssignment}/evaluate', [DailyAssignmentController::class, 'evaluate']);
    Route::post('homework/daily-assignments/{dailyAssignment}/submit', [DailyAssignmentController::class, 'submit']);

    // Homework CRUD
    Route::apiResource('homework/homeworks', HomeworkController::class);

    // Homework submissions (teacher views / evaluates)
    Route::get('homework/homeworks/{homeworkId}/submissions', [HomeworkSubmissionController::class, 'index']);
    Route::put('homework/submissions/{id}/evaluate', [HomeworkSubmissionController::class, 'evaluate']);
});
