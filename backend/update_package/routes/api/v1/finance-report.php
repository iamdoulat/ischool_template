<?php

use App\Http\Controllers\Api\v1\Finance\FinanceReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('finance-reports')->group(function () {
    Route::get('balance-fees-statement', [FinanceReportController::class, 'balanceFeesStatement']);
    Route::get('balance-fees-report', [FinanceReportController::class, 'balanceFeesReport']);
    Route::get('balance-fees-report-with-remark', [FinanceReportController::class, 'balanceFeesReportWithRemark']);
    Route::get('income-report', [FinanceReportController::class, 'incomeReport']);
    Route::get('income-group-report', [FinanceReportController::class, 'incomeGroupReport']);
    Route::get('income-group-filters', [FinanceReportController::class, 'incomeGroupFilters']);
    Route::get('payroll-report', [FinanceReportController::class, 'payrollReport']);
    Route::get('expense-report', [FinanceReportController::class, 'expenseReport']);
    Route::get('expense-group-report', [FinanceReportController::class, 'expenseGroupReport']);
    Route::get('expense-group-filters', [FinanceReportController::class, 'expenseGroupFilters']);
    Route::get('fees-collection-report', [FinanceReportController::class, 'feesCollectionReport']);
    Route::get('online-fees-collection-report', [FinanceReportController::class, 'onlineFeesCollectionReport']);
    Route::get('online-admission-fees-collection-report', [FinanceReportController::class, 'onlineAdmissionFeesCollectionReport']);
    Route::get('collection-filters', [FinanceReportController::class, 'getCollectionFilters']);
    Route::get('daily-collection', [FinanceReportController::class, 'dailyCollectionReport']);
    Route::get('fees-statement', [FinanceReportController::class, 'feesStatement']);
    Route::get('due-fees-report', [FinanceReportController::class, 'dueFeesReport']);
    Route::get('income-expense-balance-report', [FinanceReportController::class, 'incomeExpenseBalanceReport']);
});
