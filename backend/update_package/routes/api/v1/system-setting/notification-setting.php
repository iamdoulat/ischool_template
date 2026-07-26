<?php

use App\Http\Controllers\Api\v1\SystemSetting\NotificationSettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting')->group(function () {
    Route::get('notification-settings', [NotificationSettingController::class, 'index']);
    Route::post('notification-settings/bulk-update', [NotificationSettingController::class, 'bulkUpdate']);
});
