<?php

use App\Http\Controllers\Api\v1\OnlineExamination\OnlineExamController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('online-examination/online-exams/{id}/assign-questions', [OnlineExamController::class, 'assignQuestions']);
    Route::apiResource('online-examination/online-exams', OnlineExamController::class);
});
