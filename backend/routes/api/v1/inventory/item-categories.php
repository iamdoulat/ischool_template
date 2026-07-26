<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Inventory\ItemCategoryController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('inventory/item-categories', ItemCategoryController::class);
});
