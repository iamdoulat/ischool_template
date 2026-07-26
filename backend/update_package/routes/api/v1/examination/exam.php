<?php

use App\Http\Controllers\Api\v1\Examination\ExamController;
use App\Http\Controllers\Api\v1\Examination\ExamStudentController;
use App\Http\Controllers\Api\v1\Examination\ExamScheduleController;
use App\Http\Controllers\Api\v1\Examination\ExamMarkController;
use App\Http\Controllers\Api\v1\Examination\ExamRemarkController;
use App\Http\Controllers\Api\v1\Examination\ExamRankController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/exams/unlinked', [ExamController::class, 'index']);
    Route::post('examination/exams/link', [ExamController::class, 'link']);
    Route::apiResource('examination/exams', ExamController::class);

    // Exam Students
    Route::get('examination/exams/{id}/students', [ExamStudentController::class, 'index']);
    Route::post('examination/exams/{id}/students', [ExamStudentController::class, 'store']);

    // Exam Schedules (Subjects)
    Route::post('examination/exam-schedules', [ExamScheduleController::class, 'store']);

    // Exam Marks
    Route::get('examination/exams/{id}/marks', [ExamMarkController::class, 'index']);
    Route::post('examination/exams/{id}/marks', [ExamMarkController::class, 'store']);

    // Teacher Remarks
    Route::get('examination/exams/{id}/remarks', [ExamRemarkController::class, 'index']);
    Route::post('examination/exams/{id}/remarks', [ExamRemarkController::class, 'store']);

    // Generate Rank
    Route::post('examination/exams/{id}/generate-rank', [ExamRankController::class, 'generate']);
});
