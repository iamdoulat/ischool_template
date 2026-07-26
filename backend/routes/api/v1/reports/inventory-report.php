<?php

use App\Http\Controllers\Api\v1\Reports\InventoryReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/inventory')->group(function () {
    Route::get('/stack', [InventoryReportController::class, 'getStackReport']);
    Route::get('/add-item', [InventoryReportController::class, 'getAddItemReport']);
    Route::get('/issue-item', [InventoryReportController::class, 'getIssueItemReport']);
});
