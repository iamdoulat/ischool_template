<?php

use App\Http\Controllers\Api\v1\AnnualCalendar\HolidayTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('annual-calendar/holiday-types', HolidayTypeController::class);
});
