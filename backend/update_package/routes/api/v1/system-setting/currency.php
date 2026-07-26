<?php

use App\Http\Controllers\Api\v1\SystemSetting\CurrencyController;
use Illuminate\Support\Facades\Route;

Route::prefix('system-setting/currencies')->group(function () {
    Route::get('/', [CurrencyController::class, 'index']);
    Route::post('/batch-update', [CurrencyController::class, 'updateBatch']);
    Route::post('/{id}/toggle-active', [CurrencyController::class, 'toggleActive']);
    Route::post('/{id}/toggle-enabled', [CurrencyController::class, 'toggleEnabled']);
});
