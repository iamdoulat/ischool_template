<?php

use App\Http\Controllers\Api\v1\Examination\CbseExamCategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/cbse-exam-categories', CbseExamCategoryController::class);
});
