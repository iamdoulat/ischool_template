<?php

use App\Http\Controllers\Api\v1\Alumni\ManageAlumniController;
use Illuminate\Support\Facades\Route;

Route::prefix('alumni')->group(function () {
    Route::get('manage', [ManageAlumniController::class, 'index']);
});
