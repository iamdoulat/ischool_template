<?php

use App\Http\Controllers\Api\v1\Examination\ExamScheduleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/exam-schedules/criteria', [ExamScheduleController::class, 'getCriteriaData']);
    Route::get('examination/exam-schedules/all', [ExamScheduleController::class, 'getAllSchedules']);
    Route::post('examination/exam-schedules/search', [ExamScheduleController::class, 'searchSchedule']);
});
