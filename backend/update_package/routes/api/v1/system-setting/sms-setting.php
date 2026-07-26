<?php

use App\Http\Controllers\Api\v1\SystemSetting\SmsSettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting')->group(function () {
    Route::get('sms-settings', [SmsSettingController::class, 'index']);
    Route::post('sms-settings', [SmsSettingController::class, 'store']);
    Route::post('sms-settings/test', [SmsSettingController::class, 'testSms']);
});
