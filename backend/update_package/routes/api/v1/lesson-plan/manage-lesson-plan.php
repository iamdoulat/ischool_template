<?php

use App\Http\Controllers\Api\v1\LessonPlan\LessonPlanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('lesson-plan/manage-lesson-plan', [LessonPlanController::class, 'index']);
    Route::post('lesson-plan/manage-lesson-plan', [LessonPlanController::class, 'store']);
    Route::get('lesson-plan/manage-lesson-plan/{id}', [LessonPlanController::class, 'show']);
    Route::put('lesson-plan/manage-lesson-plan/{id}', [LessonPlanController::class, 'update']);
    Route::delete('lesson-plan/manage-lesson-plan/{id}', [LessonPlanController::class, 'destroy']);
});
