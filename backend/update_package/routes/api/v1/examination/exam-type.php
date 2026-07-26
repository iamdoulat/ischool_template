<?php

use App\Http\Controllers\Api\v1\Examination\ExamTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/exam-types', ExamTypeController::class);
});
