<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Reports\LessonPlanReportController;

Route::prefix('reports/lesson-plan')->group(function () {
    Route::get('/criteria', [LessonPlanReportController::class, 'getCriteriaData']);
    Route::get('/report', [LessonPlanReportController::class, 'getLessonPlanReport']);
    Route::get('/syllabus', [LessonPlanReportController::class, 'getSyllabusReport']);
});
