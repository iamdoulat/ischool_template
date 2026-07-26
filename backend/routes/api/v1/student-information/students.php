<?php

use App\Http\Controllers\Api\v1\StudentInformation\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/students/generate-admission-no', [StudentController::class, 'generateAdmissionNo']);
    Route::get('/students/generate-roll-no', [StudentController::class, 'generateRollNo']);
    Route::get('/students/generate-username', [StudentController::class, 'generateUsername']);
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::post('/students/import', [StudentController::class, 'bulkImport']);
    Route::get('/students/disabled', [StudentController::class, 'indexDisabled']);
    Route::post('/students/bulk-delete', [StudentController::class, 'bulkDelete']);
    Route::get('/students/{student}/matching-parent-username', [StudentController::class, 'matchingParentUsername']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::put('/students/{id}', [StudentController::class, 'update']);
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);
    Route::post('/students/{id}/toggle-status', [StudentController::class, 'toggleStatus']);
    
    // Reports
    Route::get('/student-reports/class-section', [App\Http\Controllers\Api\v1\StudentInformation\StudentReportController::class, 'classSectionReport']);
    Route::get('/student-reports/gender-ratio', [App\Http\Controllers\Api\v1\StudentInformation\StudentReportController::class, 'genderRatioReport']);
    Route::get('/student-reports/student-teacher-ratio', [App\Http\Controllers\Api\v1\StudentInformation\StudentReportController::class, 'studentTeacherRatioReport']);
});
