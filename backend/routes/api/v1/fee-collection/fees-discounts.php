<?php

use App\Http\Controllers\Api\v1\FeeCollection\FeeDiscountController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('fee-discounts', FeeDiscountController::class);
});
