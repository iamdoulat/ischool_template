<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\ExpenseHeadController;

Route::apiResource('expense/expense-heads', ExpenseHeadController::class);
