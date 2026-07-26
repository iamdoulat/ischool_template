<?php

use App\Http\Controllers\Api\v1\Examination\CbseReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/cbse-reports/criteria', [CbseReportController::class, 'getCriteriaData']);
    Route::post('examination/cbse-reports/subject-marks', [CbseReportController::class, 'getSubjectMarksReport']);
    Route::post('examination/cbse-reports/students', [CbseReportController::class, 'searchStudents']);
});
