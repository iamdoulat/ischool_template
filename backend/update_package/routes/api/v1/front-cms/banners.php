<?php

use App\Http\Controllers\Api\v1\FrontCms\BannerController;
use Illuminate\Support\Facades\Route;

Route::prefix('front-cms')->group(function () {
    Route::get('/banners', [BannerController::class, 'index']);
    Route::post('/banners', [BannerController::class, 'store']);
    Route::delete('/banners/{id}', [BannerController::class, 'destroy']);
});
