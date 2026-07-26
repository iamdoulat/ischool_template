<?php

use App\Http\Controllers\Api\v1\Examination\ExamGroupController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/exam-groups', ExamGroupController::class);
});
