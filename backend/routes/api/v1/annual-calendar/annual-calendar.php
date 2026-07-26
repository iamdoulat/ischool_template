<?php

use App\Http\Controllers\Api\v1\AnnualCalendar\AnnualCalendarController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('annual-calendar/annual-calendars', AnnualCalendarController::class);
});
