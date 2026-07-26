<?php

use App\Http\Controllers\Api\v1\Examination\MarksGradeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/marks-grades', MarksGradeController::class);
});
