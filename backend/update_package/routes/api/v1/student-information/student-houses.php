<?php

use App\Http\Controllers\Api\v1\StudentInformation\StudentHouseController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('student-houses/bulk-delete', [StudentHouseController::class, 'bulkDelete']);
    Route::apiResource('student-houses', StudentHouseController::class);
});
