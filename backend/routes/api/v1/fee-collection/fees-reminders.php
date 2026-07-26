<?php

use App\Http\Controllers\Api\v1\FeeCollection\FeeReminderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('fee-reminders', [FeeReminderController::class, 'index']);
    Route::post('fee-reminders/bulk-update', [FeeReminderController::class, 'bulkUpdate']);
    Route::post('fee-reminders/send', [FeeReminderController::class, 'sendReminders']);
    Route::apiResource('fee-reminders', FeeReminderController::class)->only(['update']);
});
