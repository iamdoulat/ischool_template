<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Inventory\ItemController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('inventory/items', ItemController::class);
});
