<?php

use App\Http\Controllers\Api\v1\LessonPlan\LessonController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('lesson-plan/lessons', LessonController::class);
});
