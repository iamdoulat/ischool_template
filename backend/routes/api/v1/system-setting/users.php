<?php

use App\Http\Controllers\Api\v1\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('system-setting')->group(function () {
    Route::get('users/generate-parent-username', [UserController::class, 'generateParentUsername']);
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/reset-password', [UserController::class, 'adminResetPassword']);
});
