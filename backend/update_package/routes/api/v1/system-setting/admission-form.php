<?php

use App\Http\Controllers\Api\v1\SystemSetting\AdmissionFormController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting/admission-form')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [AdmissionFormController::class, 'index']);
    Route::post('settings', [AdmissionFormController::class, 'updateSettings']);
    Route::post('documents', [AdmissionFormController::class, 'addDocument']);
    Route::put('documents/{id}', [AdmissionFormController::class, 'updateDocument']);
    Route::delete('documents/{id}', [AdmissionFormController::class, 'deleteDocument']);
    Route::post('fields', [AdmissionFormController::class, 'updateFields']);
});
