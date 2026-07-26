<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\OnlineCourse\CourseSettingController;
use App\Http\Controllers\Api\v1\OnlineCourse\CourseReportController;
use App\Http\Controllers\Api\v1\OnlineCourse\OfflinePaymentController;
use App\Http\Controllers\Api\v1\OnlineCourse\OnlineCourseController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('online-course/courses', OnlineCourseController::class);
    
    Route::get('online-course/offline-payments/criteria', [OfflinePaymentController::class, 'getCriteria']);
    Route::get('online-course/offline-payments/students', [OfflinePaymentController::class, 'getStudents']);
    Route::get('online-course/offline-payments/search-courses', [OfflinePaymentController::class, 'searchCourses']);
    Route::post('online-course/offline-payments', [OfflinePaymentController::class, 'store']);
    
    Route::get('online-course/reports/criteria', [CourseReportController::class, 'getCriteria']);
    Route::get('online-course/reports', [CourseReportController::class, 'index']);
    Route::get('online-course/settings', [CourseSettingController::class, 'show']);
    Route::post('online-course/settings', [CourseSettingController::class, 'update']);
});
