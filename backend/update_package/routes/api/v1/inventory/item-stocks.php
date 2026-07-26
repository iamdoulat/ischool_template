<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Inventory\ItemStockController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('inventory/item-stocks', ItemStockController::class);
});
