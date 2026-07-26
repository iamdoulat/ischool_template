<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\v1\HealthCheckController;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\UserController;

Route::prefix('v1')->group(function () {
    Route::get('/health-check', [HealthCheckController::class, 'index']);
    Route::get('/migrate-now', function () {
        \Illuminate\Support\Facades\Artisan::call('migrate');
        return response()->json(['message' => 'Migrated', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    });

    // Include Modular Routes
    require __DIR__ . '/api/v1/auth.php';
    require __DIR__ . '/api/v1/system-setting/users.php';
    require __DIR__ . '/api/v1/system-setting/roles.php';
    require __DIR__ . '/api/v1/system-setting/email-setting.php';
    require __DIR__ . '/api/v1/system-setting/general-setting.php';
    require __DIR__ . '/api/v1/system-setting/session-setting.php';
    require __DIR__ . '/api/v1/system-setting/languages.php';
    require __DIR__ . '/api/v1/system-setting/notification-setting.php';
    require __DIR__ . '/api/v1/system-setting/sms-setting.php';
    require __DIR__ . '/api/v1/system-setting/payment-setting.php';
    require __DIR__ . '/api/v1/system-setting/payment-gateway-setting.php';
    require __DIR__ . '/api/v1/system-setting/print-setting.php';
    require __DIR__ . '/api/v1/system-setting/thermal-print-setting.php';
    require __DIR__ . '/api/v1/system-setting/print-header-footer-setting.php';
    require __DIR__ . '/api/v1/system-setting/front-cms-setting.php';
    require __DIR__ . '/api/v1/system-setting/backup.php';
    require __DIR__ . '/api/v1/system-setting/currency.php';
    require __DIR__ . '/api/v1/system-setting/student-profile-setting.php';
    require __DIR__ . '/api/v1/system-setting/online-admission.php';
    require __DIR__ . '/api/v1/system-setting/admission-form.php';
    require __DIR__ . '/api/v1/system-setting/sidebar-menu.php';
    require __DIR__ . '/api/v1/system-setting/captcha-setting.php';
    require __DIR__ . '/api/v1/system-setting/system-fields.php';
    require __DIR__ . '/api/v1/system-setting/custom-fields.php';
    require __DIR__ . '/api/v1/system-setting/file-types.php';
    require __DIR__ . '/api/v1/system-setting/system-update.php';


    require __DIR__ . '/api/v1/front-cms/menus.php';
    require __DIR__ . '/api/v1/front-cms/pages.php';
    require __DIR__ . '/api/v1/front-cms/banners.php';
    require __DIR__ . '/api/v1/front-cms/news.php';
    require __DIR__ . '/api/v1/front-cms/gallery.php';
    require __DIR__ . '/api/v1/front-cms/events.php';
    require __DIR__ . '/api/v1/front-cms/media.php';
    require __DIR__ . '/api/v1/front-cms/settings.php';
    require __DIR__ . '/api/v1/front-office/front-office.php';
    require __DIR__ . '/api/v1/human-resource/staff-directory.php';
    require __DIR__ . '/api/v1/hr/staff-attendance.php';
    require __DIR__ . '/api/v1/hr/payroll.php';
    require __DIR__ . '/api/v1/student-information/students.php';
    require __DIR__ . '/api/v1/student-information/online-admissions.php';
    require __DIR__ . '/api/v1/student-information/multi-class-students.php';
    require __DIR__ . '/api/v1/student-information/student-categories.php';
    require __DIR__ . '/api/v1/student-information/disable-reasons.php';
    require __DIR__ . '/api/v1/student-information/student-houses.php';

    // Front Office
    require __DIR__ . '/api/v1/front-office/admission-enquiries.php';
    require __DIR__ . '/api/v1/front-office/visitors.php';
    require __DIR__ . '/api/v1/front-office/phone-call-logs.php';
    require __DIR__ . '/api/v1/front-office/postal-dispatches.php';
    require __DIR__ . '/api/v1/front-office/postal-receives.php';
    require __DIR__ . '/api/v1/front-office/complaints.php';
    require __DIR__ . '/api/v1/front-office/purposes.php';
    require __DIR__ . '/api/v1/front-office/complaint-types.php';
    require __DIR__ . '/api/v1/front-office/sources.php';
    require __DIR__ . '/api/v1/front-office/references.php';
    Route::get('/test-students', function (\Illuminate\Http\Request $request) {
    return \App\Models\User::where('role', 'Student')
        ->where('school_class_id', $request->school_class_id)
        ->where('section_id', $request->section_id)
        ->get();
});

Route::get('/dump-routes', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes())
        ->filter(fn($route) => str_contains($route->uri(), 'subject-groups'))
        ->map(fn($route) => ['method' => $route->methods(), 'uri' => $route->uri(), 'action' => $route->getActionName()])
        ->values();
    return response()->json($routes);
});

Route::put('/academics/subject-groups/{id}', [\App\Http\Controllers\Api\v1\Academics\SubjectGroupController::class, 'update']);
Route::delete('/academics/subject-groups/{id}', [\App\Http\Controllers\Api\v1\Academics\SubjectGroupController::class, 'destroy']);

Route::middleware('auth:sanctum')->group(function () {
        // Add Leave management routes here:
        Route::apiResource('hr/leave-types', \App\Http\Controllers\LeaveTypeController::class);
        Route::apiResource('hr/leave-requests', \App\Http\Controllers\LeaveRequestController::class);
        Route::put('hr/leave-requests/{leave_request}/status', [\App\Http\Controllers\LeaveRequestController::class, 'updateStatus']);
        require __DIR__ . '/api/v1/notifications.php';
    });

    require __DIR__ . '/api/v1/file-upload.php';
    Route::prefix('academics')->group(function () {
        require __DIR__ . '/api/v1/academics/sections.php';
        require __DIR__ . '/api/v1/academics/classes.php';
        require __DIR__ . '/api/v1/academics/subjects.php';
        require __DIR__ . '/api/v1/academics/subject-groups.php';
        require __DIR__ . '/api/v1/academics/promote-students.php';
        require __DIR__ . '/api/v1/academics/class-teachers.php';
        require __DIR__ . '/api/v1/academics/class-timetables.php';
    });
    // Fee Collection
    require __DIR__ . '/api/v1/fee-collection/fees-types.php';
    require __DIR__ . '/api/v1/fee-collection/fees-groups.php';
    require __DIR__ . '/api/v1/fee-collection/fees-masters.php';
    require __DIR__ . '/api/v1/fee-collection/fees-reminders.php';
    require __DIR__ . '/api/v1/fee-collection/fee-collection.php';
    require __DIR__ . '/api/v1/fee-collection/fees-carry-forward.php';
    require __DIR__ . '/api/v1/fee-collection/fees-discounts.php';
    require __DIR__ . '/api/v1/fee-collection/offline-payments.php';
    require __DIR__ . '/api/v1/attendance/student-attendance.php';
    require __DIR__ . '/api/v1/attendance/period-attendance.php';
    require __DIR__ . '/api/v1/attendance/student-leave.php';
    require __DIR__ . '/api/v1/transport/transport.php';
    require __DIR__ . '/api/v1/hostel/hostels.php';
    require __DIR__ . '/api/v1/hostel/rooms.php';

    require __DIR__ . '/api/v1/income/income-heads.php';
    require __DIR__ . '/api/v1/income/incomes.php';

    require __DIR__ . '/api/v1/expense/expense-heads.php';
    require __DIR__ . '/api/v1/expense/expenses.php';

    require __DIR__ . '/api/v1/inventory/item-suppliers.php';
    require __DIR__ . '/api/v1/inventory/item-stores.php';
    require __DIR__ . '/api/v1/inventory/item-categories.php';
    require __DIR__ . '/api/v1/inventory/items.php';
    require __DIR__ . '/api/v1/inventory/item-stocks.php';
    require __DIR__ . '/api/v1/inventory/issue-items.php';
    require __DIR__ . '/api/v1/library/library-members.php';
    require __DIR__ . '/api/v1/homework/daily-assignments.php';
    require __DIR__ . '/api/v1/download-center/download-center.php';
    require __DIR__ . '/api/v1/communicate/sms-templates.php';
    require __DIR__ . '/api/v1/communicate/wa-templates.php';
    require __DIR__ . '/api/v1/communicate/email-templates.php';
    require __DIR__ . '/api/v1/communicate/communicate.php';
    require __DIR__ . '/api/v1/communicate/notices.php';
    require __DIR__ . '/api/v1/lesson-plan/topic.php';
    require __DIR__ . '/api/v1/lesson-plan/lesson.php';
    require __DIR__ . '/api/v1/lesson-plan/manage-lesson-plan.php';
    require __DIR__ . '/api/v1/annual-calendar/holiday-type.php';
    require __DIR__ . '/api/v1/annual-calendar/annual-calendar.php';
    require __DIR__ . '/api/v1/online-examination/question-bank.php';
    require __DIR__ . '/api/v1/online-examination/online-exam.php';
    require __DIR__ . '/api/v1/examination/exam-type.php';
    require __DIR__ . '/api/v1/examination/marks-division.php';
    require __DIR__ . '/api/v1/examination/marks-grade.php';
    require __DIR__ . '/api/v1/examination/print-marksheet.php';
    require __DIR__ . '/api/v1/examination/marksheet-template.php';
    require __DIR__ . '/api/v1/examination/print-admit-card.php';
    require __DIR__ . '/api/v1/examination/admit-card-template.php';
    require __DIR__ . '/api/v1/certificate/certificate.php';
    require __DIR__ . '/api/v1/examination/exam-result.php';
    require __DIR__ . '/api/v1/examination/public-exam-result.php';
    require __DIR__ . '/api/v1/examination/exam-schedule.php';
    require __DIR__ . '/api/v1/examination/exam-group.php';
    require __DIR__ . '/api/v1/examination/exam.php';
    require __DIR__ . '/api/v1/examination/cbse-exam-category.php';
    require __DIR__ . '/api/v1/examination/cbse-report.php';
    require __DIR__ . '/api/v1/examination/cbse-observation.php';
    require __DIR__ . '/api/v1/examination/cbse-template.php';
    require __DIR__ . '/api/v1/examination/cbse-exam.php';
    require __DIR__ . '/api/v1/attendance/qr-attendance.php';
    require __DIR__ . '/api/v1/attendance/zkteco.php';
    require __DIR__ . '/api/v1/conference/zoom.php';
    require __DIR__ . '/api/v1/conference/gmeet.php';
    require __DIR__ . '/api/v1/multi-branch/branch.php';
    require __DIR__ . '/api/v1/behaviour/behaviour.php';
    require __DIR__ . '/api/v1/online-course/course.php';
    require __DIR__ . '/api/v1/student-cv/cv.php';
    require __DIR__ . '/api/v1/alumni/events.php';
    require __DIR__ . '/api/v1/alumni/manage.php';
    require __DIR__ . '/api/v1/finance-report.php';
    require __DIR__ . '/api/v1/reports/attendance-report.php';
    require __DIR__ . '/api/v1/reports/examination-report.php';
    require __DIR__ . '/api/v1/reports/online-examination-report.php';
    require __DIR__ . '/api/v1/reports/lesson-plan-report.php';
    require __DIR__ . '/api/v1/reports/human-resource-report.php';
    require __DIR__ . '/api/v1/reports/homework-report.php';
    require __DIR__ . '/api/v1/reports/library-report.php';
    require __DIR__ . '/api/v1/reports/inventory-report.php';
    require __DIR__ . '/api/v1/reports/transport-report.php';
    require __DIR__ . '/api/v1/reports/hostel-report.php';
    require __DIR__ . '/api/v1/reports/alumni-report.php';
    require __DIR__ . '/api/v1/reports/audit-trail-report.php';
    require __DIR__ . '/api/v1/reports/user-log-report.php';

    Route::get('dashboard', [\App\Http\Controllers\Api\v1\DashboardController::class, 'index'])->middleware('auth:sanctum');

    require __DIR__ . '/api/v1/cron.php';
    require __DIR__ . '/api/v1/face-recognition.php';
    require __DIR__ . '/api/v1/smart-attendance.php';
    require __DIR__ . '/api/v1/user-portal/portal.php';
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
