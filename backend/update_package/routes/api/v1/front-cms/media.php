<?php

use App\Http\Controllers\Api\v1\FrontCms\MediaController;
use Illuminate\Support\Facades\Route;

Route::prefix('front-cms')->group(function () {
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media', [MediaController::class, 'store']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);
});
