<?php

use App\Http\Controllers\Api\v1\StudentInformation\StudentCategoryController;
use Illuminate\Support\Facades\Route;

// Public: anyone can view categories
Route::get('student-categories', [StudentCategoryController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('student-categories/bulk-delete', [StudentCategoryController::class, 'bulkDelete']);
    Route::apiResource('student-categories', StudentCategoryController::class)->except(['index']);
});
