<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\MultiBranch\BranchController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('multi-branch/overview', [\App\Http\Controllers\Api\v1\MultiBranch\MultiBranchOverviewController::class, 'index']);
    Route::get('multi-branch/reports', [\App\Http\Controllers\Api\v1\MultiBranch\MultiBranchReportController::class, 'index']);
    Route::apiResource('multi-branch/branches', BranchController::class);
});
