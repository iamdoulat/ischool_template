<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Communicate\SmsTemplateController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('communicate/sms-templates', SmsTemplateController::class);
});
