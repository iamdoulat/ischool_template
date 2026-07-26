<?php

use App\Http\Controllers\Api\v1\Reports\LibraryReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports/library')->group(function () {
    Route::get('/issue',     [LibraryReportController::class, 'getBookIssueReport']);
    Route::get('/due',       [LibraryReportController::class, 'getBookDueReport']);
    Route::get('/inventory', [LibraryReportController::class, 'getBookInventoryReport']);
    Route::get('/return',    [LibraryReportController::class, 'getBookIssueReturnReport']);
});
