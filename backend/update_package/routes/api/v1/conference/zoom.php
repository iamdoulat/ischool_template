<?php

use App\Http\Controllers\Api\v1\Conference\ZoomSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('conference/zoom-settings', [ZoomSettingController::class, 'index']);
    Route::post('conference/zoom-settings', [ZoomSettingController::class, 'update']);
    Route::get('conference/live-meetings/criteria', [\App\Http\Controllers\Api\v1\Conference\LiveMeetingController::class, 'getCriteria']);
    Route::apiResource('conference/live-meetings', \App\Http\Controllers\Api\v1\Conference\LiveMeetingController::class);
    Route::get('conference/live-classes/criteria', [\App\Http\Controllers\Api\v1\Conference\LiveClassController::class, 'getCriteria']);
    Route::apiResource('conference/live-classes', \App\Http\Controllers\Api\v1\Conference\LiveClassController::class);
});
