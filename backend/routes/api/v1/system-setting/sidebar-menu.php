<?php

use App\Http\Controllers\Api\v1\SystemSetting\SidebarMenuController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting/sidebar-menu')->group(function () {
    Route::get('/', [SidebarMenuController::class, 'index'])->middleware('auth:sanctum');
    Route::post('update', [SidebarMenuController::class, 'update'])->middleware('auth:sanctum');
});
