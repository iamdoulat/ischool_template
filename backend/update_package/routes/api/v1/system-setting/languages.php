<?php

use App\Http\Controllers\Api\v1\SystemSetting\LanguageController;
use Illuminate\Support\Facades\Route;

// Public: enabled languages for the portal / login language switcher.
Route::get('/system-setting/languages/public', [LanguageController::class, 'publicList']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/system-setting/languages', [LanguageController::class, 'index']);
    Route::post('/system-setting/languages', [LanguageController::class, 'store']);
    Route::put('/system-setting/languages/{id}', [LanguageController::class, 'update']);
    Route::get('/system-setting/languages/translations/{code}', [LanguageController::class, 'getTranslations']);
    Route::delete('/system-setting/languages/{id}', [LanguageController::class, 'destroy']);
});
