<?php

use App\Http\Controllers\Api\v1\Academics\ClassTeacherController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/class-teachers', [ClassTeacherController::class, 'index']);
    Route::post('/class-teachers', [ClassTeacherController::class, 'store']);
    Route::delete('/class-teachers/{key}', [ClassTeacherController::class, 'destroy']);
    Route::post('/class-teachers/bulk-delete', [ClassTeacherController::class, 'bulkDestroy']);
});
