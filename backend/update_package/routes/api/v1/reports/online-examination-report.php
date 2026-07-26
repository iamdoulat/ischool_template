<?php

use App\Http\Controllers\Api\v1\Reports\OnlineExaminationReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/online-examinations')->group(function () {
    Route::get('/criteria', [OnlineExaminationReportController::class, 'getCriteriaData']);
    Route::get('/result', [OnlineExaminationReportController::class, 'getResultReport']);
    Route::get('/exams', [OnlineExaminationReportController::class, 'getExamsReport']);
    Route::get('/attempts', [OnlineExaminationReportController::class, 'getAttemptsReport']);
    Route::get('/rank', [OnlineExaminationReportController::class, 'getRankReport']);
});

