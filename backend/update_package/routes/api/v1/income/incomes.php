<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\IncomeController;

Route::get('income/incomes/next-invoice-number', [IncomeController::class, 'nextInvoiceNumber']);
Route::apiResource('income/incomes', IncomeController::class);
