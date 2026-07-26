<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->boolean('online_exam_show_only_my_question')->default(false)->after('fees_allow_student_to_add_partial_payment');
            $table->string('id_card_scan_code')->nullable()->default('barcode')->after('online_exam_show_only_my_question');
            $table->boolean('exam_result_page_in_front_site')->default(false)->after('id_card_scan_code');
            $table->boolean('exam_admit_card_download_in_student_panel')->default(false)->after('exam_result_page_in_front_site');
            $table->boolean('teacher_restricted_mode')->default(false)->after('exam_admit_card_download_in_student_panel');
            $table->boolean('superadmin_visibility')->default(false)->after('teacher_restricted_mode');
            $table->boolean('event_reminder')->default(false)->after('superadmin_visibility');
            $table->string('staff_apply_leave_notification_email')->nullable()->after('event_reminder');
            $table->boolean('enable_multi_class_selection_in_student_admission_form')->default(false)->after('staff_apply_leave_notification_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'online_exam_show_only_my_question',
                'id_card_scan_code',
                'exam_result_page_in_front_site',
                'exam_admit_card_download_in_student_panel',
                'teacher_restricted_mode',
                'superadmin_visibility',
                'event_reminder',
                'staff_apply_leave_notification_email',
                'enable_multi_class_selection_in_student_admission_form',
            ]);
        });
    }
};
