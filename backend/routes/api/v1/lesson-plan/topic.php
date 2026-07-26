<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\LessonPlan\TopicController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('lesson-plan/topics', TopicController::class);
    Route::put('lesson-plan/topics/{id}/status', [TopicController::class, 'updateStatus']);
    Route::post('lesson-plan/copy-topics', [TopicController::class, 'copy']);
});
