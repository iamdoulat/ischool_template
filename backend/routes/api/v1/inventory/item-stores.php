<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Inventory\ItemStoreController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('inventory/item-stores', ItemStoreController::class);
});
