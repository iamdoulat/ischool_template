<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Reports\ExaminationReportController;

Route::prefix('reports/examinations')->group(function () {
    Route::get('criteria', [ExaminationReportController::class, 'getCriteriaData']);
    Route::get('exams/{groupId}', [ExaminationReportController::class, 'getExamsByGroup']);
    Route::get('rank', [ExaminationReportController::class, 'getRankReport']);
});
