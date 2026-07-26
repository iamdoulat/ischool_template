<?php

use App\Http\Controllers\Api\v1\Academics\SectionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('sections', SectionController::class)->except(['index']);
});
Route::get('sections', [SectionController::class, 'index']);
