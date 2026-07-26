<?php

use App\Http\Controllers\Api\v1\OnlineExamination\QuestionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('online-examination/questions/bulk-delete', [QuestionController::class, 'bulkDelete']);
    Route::post('online-examination/questions/import', [QuestionController::class, 'bulkImport']);
    Route::apiResource('online-examination/questions', QuestionController::class);
});
