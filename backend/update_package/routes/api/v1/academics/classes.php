<?php

use App\Http\Controllers\Api\v1\Academics\ClassController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('classes', ClassController::class)->except(['index']);
});
Route::get('classes', [ClassController::class, 'index']);
