<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Communicate\EmailTemplateController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('communicate/email-templates', EmailTemplateController::class);
    Route::get('communicate/email-templates/{id}/download-attachment', [EmailTemplateController::class, 'downloadAttachment']);
});
