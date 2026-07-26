<?php

use App\Http\Controllers\Api\v1\FrontCms\NewsController;
use Illuminate\Support\Facades\Route;

Route::prefix('front-cms')->group(function () {
    Route::get('/news', [NewsController::class, 'index']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::put('/news/{id}', [NewsController::class, 'update']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);
});
