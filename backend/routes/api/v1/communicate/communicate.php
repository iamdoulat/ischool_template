<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Communicate\CommunicateController;
use App\Http\Controllers\Api\v1\Communicate\SmsTemplateController;
use App\Http\Controllers\Api\v1\Communicate\EmailTemplateController;
use App\Http\Controllers\Api\v1\Communicate\WaTemplateController;

use App\Http\Controllers\Api\v1\Communicate\NotificationTemplateController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('communicate/search-students', [CommunicateController::class, 'searchStudents']);
    Route::post('communicate/send-credentials', [CommunicateController::class, 'sendCredentials']);
    Route::post('communicate/send-sms', [CommunicateController::class, 'sendSMS']);
    Route::post('communicate/send-wa', [CommunicateController::class, 'sendWA']);
    Route::post('communicate/send-email', [CommunicateController::class, 'sendEmail']);
    Route::post('communicate/send-notification', [CommunicateController::class, 'sendNotification']);
    Route::get('communicate/scheduled-logs', [CommunicateController::class, 'scheduledLogs']);
    Route::get('communicate/logs', [CommunicateController::class, 'logs']);
    Route::delete('communicate/logs/{id}', [CommunicateController::class, 'deleteLog']);
    Route::post('communicate/logs/delete-bulk', [CommunicateController::class, 'deleteLog']);
    Route::get('communicate/logs/{id}/attachment', [CommunicateController::class, 'downloadAttachment']);
    Route::get('communicate/users-by-role/{role}', [CommunicateController::class, 'usersByRole']);
    Route::get('communicate/classes', [CommunicateController::class, 'getClasses']);
    Route::get('communicate/birthday-users', [CommunicateController::class, 'birthdayUsers']);
    Route::get('communicate/students-by-class/{classId}', [CommunicateController::class, 'studentsByClass']);
    Route::apiResource('communicate/sms-templates', SmsTemplateController::class);
    Route::apiResource('communicate/email-templates', EmailTemplateController::class);
    Route::apiResource('communicate/wa-templates', WaTemplateController::class);
    Route::apiResource('communicate/notification-templates', NotificationTemplateController::class);
    Route::get('communicate/email-templates/{id}/download-attachment', [EmailTemplateController::class, 'downloadAttachment']);
});
