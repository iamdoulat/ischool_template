<?php

use App\Http\Controllers\Api\v1\Examination\CbseExamController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/cbse-exams/criteria', [CbseExamController::class, 'getCriteria']);
    Route::apiResource('examination/cbse-exams', CbseExamController::class);
});
