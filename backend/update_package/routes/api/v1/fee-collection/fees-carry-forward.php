<?php

use App\Http\Controllers\Api\v1\FeeCollection\FeesCarryForwardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('fee-collection/carry-forward/search', [FeesCarryForwardController::class, 'search']);
    Route::post('fee-collection/carry-forward/save', [FeesCarryForwardController::class, 'save']);
    Route::get('fee-collection/carry-forward/delete-search', [FeesCarryForwardController::class, 'deleteSearch']);
    Route::delete('fee-collection/carry-forward/delete', [FeesCarryForwardController::class, 'delete']);
});
