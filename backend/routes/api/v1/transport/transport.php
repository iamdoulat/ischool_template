<?php

use App\Http\Controllers\Api\v1\Transport\RouteController;
use App\Http\Controllers\Api\v1\Transport\PickupPointController;
use App\Http\Controllers\Api\v1\Transport\VehicleController;
use App\Http\Controllers\Api\v1\Transport\RoutePickupPointController;
use App\Http\Controllers\Api\v1\Transport\StudentTransportController;
use Illuminate\Support\Facades\Route;

Route::prefix('transport')->group(function () {
    Route::apiResource('routes', RouteController::class);
    Route::apiResource('pickup-points', PickupPointController::class);
    Route::apiResource('vehicles', VehicleController::class);

    // Route Pickup Point Mappings
    Route::get('route-pickup-points', [RoutePickupPointController::class, 'index']);
    Route::post('route-pickup-points', [RoutePickupPointController::class, 'store']);
    Route::get('route-pickup-points/{id}', [RoutePickupPointController::class, 'show']);
    Route::put('route-pickup-points/{id}', [RoutePickupPointController::class, 'update']);
    Route::delete('route-pickup-points/{id}', [RoutePickupPointController::class, 'destroy']);
    Route::get('route-pickup-points/by-route/{routeId}', [RoutePickupPointController::class, 'getByRoute']);

    // Student Assignments
    Route::get('student-assignments', [StudentTransportController::class, 'index']);
    Route::post('student-assignments', [StudentTransportController::class, 'assign']);
    Route::post('student-assignments/{studentId}/fees', [StudentTransportController::class, 'assignFees']);
    Route::delete('student-assignments/{studentId}', [StudentTransportController::class, 'removeAssignment']);

    // Fees Master
    Route::get('fees-master', [\App\Http\Controllers\Api\v1\Transport\TransportFeesMasterController::class, 'index']);
    Route::post('fees-master', [\App\Http\Controllers\Api\v1\Transport\TransportFeesMasterController::class, 'store']);

    // Route-Vehicle Mappings
    Route::apiResource('route-vehicles', \App\Http\Controllers\Api\v1\Transport\RouteVehicleController::class);
});
