<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Behaviour\BehaviourSettingController;
use App\Http\Controllers\Api\v1\Behaviour\BehaviourReportController;
use App\Http\Controllers\Api\v1\Behaviour\IncidentController;
use App\Http\Controllers\Api\v1\Behaviour\AssignedIncidentController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('behaviour/assigned-incidents', [AssignedIncidentController::class, 'index']);
    Route::get('behaviour/assigned-incidents/search-students', [AssignedIncidentController::class, 'searchStudents']);
    Route::post('behaviour/assigned-incidents', [AssignedIncidentController::class, 'store']);
    Route::delete('behaviour/assigned-incidents/{id}', [AssignedIncidentController::class, 'destroy']);
    Route::apiResource('behaviour/incidents', IncidentController::class);
    Route::get('behaviour/reports/criteria', [BehaviourReportController::class, 'getCriteria']);
    Route::get('behaviour/reports', [BehaviourReportController::class, 'index']);
    Route::get('behaviour/settings', [BehaviourSettingController::class, 'show']);
    Route::post('behaviour/settings', [BehaviourSettingController::class, 'update']);
});
