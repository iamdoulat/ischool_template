<?php

use App\Http\Controllers\Api\v1\Examination\ExamResultController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/exam-results/criteria', [ExamResultController::class, 'getCriteriaData']);
    Route::post('examination/exam-results/search', [ExamResultController::class, 'searchResults']);
});
