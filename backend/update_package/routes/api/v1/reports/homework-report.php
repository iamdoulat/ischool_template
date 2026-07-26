<?php

use App\Http\Controllers\Api\v1\Reports\HomeworkReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/homework')->group(function () {
    Route::get('/criteria', [HomeworkReportController::class, 'getCriteriaData']);
    Route::get('/report', [HomeworkReportController::class, 'getHomeworkReport']);
    Route::get('/evaluation', [HomeworkReportController::class, 'getHomeworkEvaluationReport']);
    Route::get('/assignment', [HomeworkReportController::class, 'getDailyAssignmentReport']);
    Route::get('/marks', [HomeworkReportController::class, 'getHomeworkMarksReport']);
});
