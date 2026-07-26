<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\FileUploadController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/upload', [FileUploadController::class, 'upload']);
    Route::delete('/upload', [FileUploadController::class, 'delete']);
});
