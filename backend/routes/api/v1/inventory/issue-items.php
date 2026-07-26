<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Inventory\IssueItemController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('inventory/issue-items', IssueItemController::class);
});
