<?php

use App\Http\Controllers\Api\v1\Academics\SubjectController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('subjects', SubjectController::class);
});
