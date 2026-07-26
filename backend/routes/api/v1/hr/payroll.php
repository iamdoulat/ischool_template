<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\HumanResource\PayrollController;

Route::prefix('hr')->group(function () {
    Route::get('/payroll', [PayrollController::class, 'index']);
    Route::post('/payroll', [PayrollController::class, 'store']);
    Route::get('/payroll/history/{userId}', [PayrollController::class, 'history']);
    Route::put('/payroll/{id}', [PayrollController::class, 'update']);
    Route::put('/payroll/{id}/pay', [PayrollController::class, 'pay']);
});
