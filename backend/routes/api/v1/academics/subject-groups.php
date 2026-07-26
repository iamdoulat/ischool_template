<?php

use App\Http\Controllers\Api\v1\Academics\SubjectGroupController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('subject-groups', SubjectGroupController::class);
});
