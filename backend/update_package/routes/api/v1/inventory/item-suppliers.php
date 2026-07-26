<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Inventory\ItemSupplierController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('inventory/item-suppliers', ItemSupplierController::class);
});
