<?php

use App\Http\Controllers\Api\v1\SystemSetting\BackupController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting/backups')->group(function () {
    Route::get('/', [BackupController::class, 'index']);
    Route::post('/', [BackupController::class, 'store']);
    Route::get('/settings', [BackupController::class, 'getSettings']);
    Route::put('/settings', [BackupController::class, 'updateSettings']);
    Route::post('/run-scheduled', [BackupController::class, 'runScheduled']);
    Route::get('/{id}/download', [BackupController::class, 'download']);
    Route::delete('/{id}', [BackupController::class, 'destroy']);
    Route::post('/{id}/restore', [BackupController::class, 'restore']);
    Route::post('/upload', [BackupController::class, 'upload']);
    Route::get('/cron-key', [BackupController::class, 'getCronKey']);
    Route::post('/cron-key/regenerate', [BackupController::class, 'regenerateCronKey']);
});
