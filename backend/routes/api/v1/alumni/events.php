<?php

use App\Http\Controllers\Api\v1\Alumni\AlumniEventController;
use Illuminate\Support\Facades\Route;

Route::prefix('alumni')->group(function () {
    Route::apiResource('events', AlumniEventController::class);
});
