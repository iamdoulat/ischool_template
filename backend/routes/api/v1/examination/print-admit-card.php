<?php

use App\Http\Controllers\Api\v1\Examination\PrintAdmitCardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('examination/print-admit-card/criteria', [PrintAdmitCardController::class, 'getCriteriaData']);
    Route::post('examination/print-admit-card/search', [PrintAdmitCardController::class, 'searchStudents']);
    Route::post('examination/print-admit-card/generate', [PrintAdmitCardController::class, 'generate']);
});
