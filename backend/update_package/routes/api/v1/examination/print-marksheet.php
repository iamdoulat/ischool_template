<?php

use App\Http\Controllers\Api\v1\Examination\PrintMarksheetController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/print-marksheet/criteria', [PrintMarksheetController::class, 'getCriteriaData']);
    Route::post('examination/print-marksheet/search', [PrintMarksheetController::class, 'searchStudents']);
    Route::post('examination/print-marksheet/generate', [PrintMarksheetController::class, 'generateMarksheet']);
});
