<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\IncomeHeadController;

Route::apiResource('income/income-heads', IncomeHeadController::class);
