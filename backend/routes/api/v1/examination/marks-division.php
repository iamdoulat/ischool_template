<?php

use App\Http\Controllers\Api\v1\Examination\MarksDivisionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/marks-divisions', MarksDivisionController::class);
});
