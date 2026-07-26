<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\FaceRecognitionController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/face-recognition/register', [FaceRecognitionController::class, 'register']);
    Route::post('/face-recognition/recognize', [FaceRecognitionController::class, 'recognize']);
    Route::get('/face-recognition/users', [FaceRecognitionController::class, 'getUsers']);
});
