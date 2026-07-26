<?php

use App\Http\Controllers\Api\v1\UserPortalController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/dashboard', [UserPortalController::class, 'dashboard']);
    Route::get('/user/profile', [UserPortalController::class, 'profile']);
    Route::get('/user/zoom-live-classes', [UserPortalController::class, 'zoomLiveClasses']);
    Route::get('/user/transport-routes', [UserPortalController::class, 'transportRoute']);
    Route::get('/user/hostel-rooms', [UserPortalController::class, 'hostelRooms']);
    Route::get('/user/library/books-issued', [UserPortalController::class, 'libraryBooksIssued']);
    Route::get('/user/teachers-reviews', [UserPortalController::class, 'teachersReviews']);
    Route::post('/user/teachers-reviews', [UserPortalController::class, 'submitTeacherRating']);
    Route::get('/user/homework', [UserPortalController::class, 'homework']);
    Route::post('/user/homework/{homeworkId}/submit', [\App\Http\Controllers\Api\v1\Homework\HomeworkSubmissionController::class, 'submit']);
    Route::get('/user/homework/{homeworkId}/submission', [\App\Http\Controllers\Api\v1\Homework\HomeworkSubmissionController::class, 'mySubmission']);

    Route::get('/user/syllabus-status', [UserPortalController::class, 'syllabusStatus']);
    Route::get('/user/class-timetable', [UserPortalController::class, 'classTimetable']);
    Route::get('/user/fees', [UserPortalController::class, 'studentFees']);
    Route::get('/user/payment-gateways', [UserPortalController::class, 'activePaymentGateways']);
    Route::post('/user/fees/offline-payment', [UserPortalController::class, 'submitOfflineFeePayment']);
    Route::get('/user/exam-results', [UserPortalController::class, 'examResults']);
    Route::get('/user/exam-schedule', [UserPortalController::class, 'examSchedule']);
    Route::get('/user/cbse-exam-schedule', [UserPortalController::class, 'cbseExamSchedule']);
    Route::get('/user/cbse-exam-result', [UserPortalController::class, 'cbseExamResult']);
    Route::get('/user/attendance', [UserPortalController::class, 'userAttendance']);
    Route::get('/user/behaviour', [UserPortalController::class, 'userBehaviour']);
    Route::get('/user/visitors', [UserPortalController::class, 'userVisitors']);
    Route::get('/user/video-tutorials', [UserPortalController::class, 'userVideoTutorials']);
    Route::get('/user/leave-types', [UserPortalController::class, 'userLeaveTypes']);
    Route::match(['get', 'post'], '/user/apply-leave', [UserPortalController::class, 'userApplyLeave']);
    Route::get('/user/online-exams', [UserPortalController::class, 'userOnlineExams']);
    Route::get('/user/online-exams/{id}', [UserPortalController::class, 'userOnlineExamDetails']);
    Route::post('/user/online-exams/{id}/submit', [UserPortalController::class, 'submitUserOnlineExam']);
    Route::get('/user/lesson-plan', [UserPortalController::class, 'userLessonPlan']);
    Route::get('/user/gmeet-live-classes', [UserPortalController::class, 'userGmeetLiveClasses']);
    Route::get('/user/online-courses', [UserPortalController::class, 'userOnlineCourses']);
    Route::get('/user/certificates', [UserPortalController::class, 'userCertificates']);
    Route::get('/user/id-card', [UserPortalController::class, 'userIdCard']);
    Route::get('/user/branches', [UserPortalController::class, 'userBranches']);
    Route::get('/user/my-qr-code', [UserPortalController::class, 'userMyQrCode']);
});
