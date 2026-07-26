<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Attendance\ZktecoAdmsController;
use App\Http\Controllers\Api\v1\Attendance\ZktecoDeviceController;

// Hardware ADMS Push Endpoints (Unauthenticated for device firmware)
Route::any('zkteco/cdata', [ZktecoAdmsController::class, 'handleCData']);
Route::any('zkteco/cdata.php', [ZktecoAdmsController::class, 'handleCData']);
Route::get('zkteco/getrequest', [ZktecoAdmsController::class, 'handleGetRequest']);
Route::get('zkteco/getrequest.php', [ZktecoAdmsController::class, 'handleGetRequest']);

// Device Management & Logs (Authenticated for dashboard admins)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('zkteco/devices', [ZktecoDeviceController::class, 'index']);
    Route::post('zkteco/devices', [ZktecoDeviceController::class, 'store']);
    Route::put('zkteco/devices/{id}', [ZktecoDeviceController::class, 'update']);
    Route::delete('zkteco/devices/{id}', [ZktecoDeviceController::class, 'destroy']);
    Route::post('zkteco/devices/{id}/pull', [ZktecoDeviceController::class, 'pullLogs']);
    Route::get('zkteco/logs', [ZktecoDeviceController::class, 'getLogs']);
    Route::get('zkteco/summary', [ZktecoDeviceController::class, 'getSummary']);
});
