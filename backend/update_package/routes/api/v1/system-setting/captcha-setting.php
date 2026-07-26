<?php

use App\Http\Controllers\Api\v1\SystemSetting\CaptchaSettingController;
use Illuminate\Support\Facades\Route;

// Public map for front-end forms (login / admission) — no auth required.
Route::get('/system-setting/captcha-settings/public', [CaptchaSettingController::class, 'publicMap']);

Route::middleware('auth:sanctum')->prefix('system-setting/captcha-settings')->group(function () {
    Route::get('/', [CaptchaSettingController::class, 'index']);
    Route::post('/{id}/toggle', [CaptchaSettingController::class, 'toggle']);
});
