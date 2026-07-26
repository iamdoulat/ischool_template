<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\ExpenseController;

Route::get('expense/expenses/next-expense-number', [ExpenseController::class, 'nextExpenseNumber']);
Route::apiResource('expense/expenses', ExpenseController::class);
