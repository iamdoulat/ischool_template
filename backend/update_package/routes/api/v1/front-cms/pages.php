<?php

use App\Http\Controllers\Api\v1\FrontCms\PageController;
use App\Http\Controllers\Api\v1\FrontCms\ContactFormController;
use Illuminate\Support\Facades\Route;

Route::prefix('front-cms')->group(function () {
    Route::get('/pages', [PageController::class, 'index']);
    Route::get('/pages/show-by-slug/{slug}', [PageController::class, 'showBySlug']);
    Route::post('/pages', [PageController::class, 'store']);
    Route::put('/pages/{id}', [PageController::class, 'update']);
    Route::delete('/pages/{id}', [PageController::class, 'destroy']);
    Route::post('/contact-form/submit', [ContactFormController::class, 'submit']);
});
