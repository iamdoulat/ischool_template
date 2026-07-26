<?php

use App\Http\Controllers\Api\v1\Academics\StudentPromotionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/student-promotion', [StudentPromotionController::class, 'index']);
    Route::post('/student-promotion', [StudentPromotionController::class, 'promote']);
});
