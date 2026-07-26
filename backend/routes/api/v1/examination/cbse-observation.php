<?php

use App\Http\Controllers\Api\v1\Examination\CbseObservationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/cbse-observations', CbseObservationController::class);
});
