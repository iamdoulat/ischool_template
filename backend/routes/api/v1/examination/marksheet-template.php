<?php

use App\Http\Controllers\Api\v1\Examination\MarksheetTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('examination/marksheet-templates', MarksheetTemplateController::class);
});
