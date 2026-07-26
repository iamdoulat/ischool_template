<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Communicate\WaTemplateController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('communicate/wa-templates', WaTemplateController::class);
});
