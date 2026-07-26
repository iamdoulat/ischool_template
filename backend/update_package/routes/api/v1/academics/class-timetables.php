<?php

use App\Http\Controllers\Api\v1\Academics\ClassTimetableController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/class-timetables', [ClassTimetableController::class, 'index']);
    Route::post('/class-timetables', [ClassTimetableController::class, 'store']);
    Route::post('/class-timetables/bulk-store', [ClassTimetableController::class, 'bulkStore']);
    Route::delete('/class-timetables/{class_timetable}', [ClassTimetableController::class, 'destroy']);
});
