<?php

use App\Http\Controllers\Api\v1\Examination\CbseTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/cbse-templates', CbseTemplateController::class);
});
