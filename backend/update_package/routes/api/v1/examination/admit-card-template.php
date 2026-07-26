<?php

use App\Http\Controllers\Api\v1\Examination\AdmitCardTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/admit-card-templates', AdmitCardTemplateController::class);
});
