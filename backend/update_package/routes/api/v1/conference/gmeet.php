<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Conference\GmeetSettingController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('conference/gmeet-settings', [GmeetSettingController::class, 'index']);
    Route::post('conference/gmeet-settings', [GmeetSettingController::class, 'update']);
    Route::get('conference/gmeet-meetings/criteria', [\App\Http\Controllers\Api\v1\Conference\GmeetMeetingController::class, 'getCriteria']);
    Route::apiResource('conference/gmeet-meetings', \App\Http\Controllers\Api\v1\Conference\GmeetMeetingController::class);
    Route::get('conference/gmeet-classes/criteria', [\App\Http\Controllers\Api\v1\Conference\GmeetClassController::class, 'getCriteria']);
    Route::apiResource('conference/gmeet-classes', \App\Http\Controllers\Api\v1\Conference\GmeetClassController::class);
});
