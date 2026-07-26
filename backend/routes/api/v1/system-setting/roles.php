<?php

use App\Http\Controllers\Api\v1\RoleController;
use App\Http\Controllers\Api\v1\PermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('roles', RoleController::class);

    // Permission routes
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::get('roles/{role}/permissions', [PermissionController::class, 'getRolePermissions']);
    Route::put('roles/{role}/permissions', [PermissionController::class, 'updateRolePermissions']);

    // Dashboard widget routes
    Route::get('roles/{role}/dashboard-widgets', [PermissionController::class, 'getRoleDashboardWidgets']);
    Route::put('roles/{role}/dashboard-widgets', [PermissionController::class, 'updateRoleDashboardWidgets']);
});
