<?php

use App\Http\Controllers\Api\v1\FrontCms\MenuController;
use Illuminate\Support\Facades\Route;

Route::prefix('front-cms')->group(function () {
    Route::get('/menus', [MenuController::class, 'index']);
    Route::post('/menus/reorder', [MenuController::class, 'reorder']);
    Route::post('/menus', [MenuController::class, 'store']);
    Route::put('/menus/{id}', [MenuController::class, 'update']);
    Route::delete('/menus/{id}', [MenuController::class, 'destroy']);
});
