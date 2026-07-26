<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Indexes Migration
 *
 * Adds composite and single-column indexes to high-traffic tables
 * to speed up common dashboard queries (attendance reports, fee lookups,
 * exam results, staff/student directory filtering).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── users table ─────────────────────────────────────────────────────
        // Filtered heavily by role in every directory & report query
        Schema::table('users', function (Blueprint $table) {
            if (!$this->hasIndex('users', 'users_role_index')) {
                $table->index('role', 'users_role_index');
            }
            // staff_id is used for search in HR, payroll & attendance
            if (!$this->hasIndex('users', 'users_staff_id_index')) {
                $table->index('staff_id', 'users_staff_id_index');
            }
            // admission_no searched in student info & fee reports
            if (!$this->hasIndex('users', 'users_admission_no_index')) {
                $table->index('admission_no', 'users_admission_no_index');
            }
// Removed composite index on role+is_active – column does not exist
            // class_section queries used in attendance & reports
            if (!$this->hasIndex('users', 'users_class_section_index')) {
                $table->index(['school_class_id', 'section_id'], 'users_class_section_index');
            }
        });

        // ── staff_attendances ────────────────────────────────────────────────
        // Reports query by date range; day-wise report filters by date
        Schema::table('staff_attendances', function (Blueprint $table) {
            if (!$this->hasIndex('staff_attendances', 'sa_date_index')) {
                $table->index('attendance_date', 'sa_date_index');
            }
            if (!$this->hasIndex('staff_attendances', 'sa_user_date_index')) {
                $table->index(['user_id', 'attendance_date'], 'sa_user_date_index');
            }
        });

        // ── student_attendances ──────────────────────────────────────────────
        Schema::table('student_attendances', function (Blueprint $table) {
            if (!$this->hasIndex('student_attendances', 'stu_att_date_index')) {
                $table->index('attendance_date', 'stu_att_date_index');
            }
            if (!$this->hasIndex('student_attendances', 'stu_att_student_date_index')) {
                $table->index(['student_id', 'attendance_date'], 'stu_att_student_date_index');
            }
        });

        // ── fee_payments ─────────────────────────────────────────────────────
        // Fee reports filter by date, payment_mode, and student via join
        Schema::table('fee_payments', function (Blueprint $table) {
            if (!$this->hasIndex('fee_payments', 'fp_date_index')) {
                $table->index('date', 'fp_date_index');
            }
            if (!$this->hasIndex('fee_payments', 'fp_payment_mode_index')) {
                $table->index('payment_mode', 'fp_payment_mode_index');
            }
        });

        // ── student_fee_masters ──────────────────────────────────────────────
        Schema::table('student_fee_masters', function (Blueprint $table) {
            if (!$this->hasIndex('student_fee_masters', 'sfm_session_index')) {
                $table->index('academic_session_id', 'sfm_session_index');
            }
            if (!$this->hasIndex('student_fee_masters', 'sfm_student_session_index')) {
                $table->index(['student_id', 'academic_session_id'], 'sfm_student_session_index');
            }
        });

        // ── exam_results ─────────────────────────────────────────────────────
        // Marksheet generation queries by exam_id + student_id
        Schema::table('exam_results', function (Blueprint $table) {
            if (!$this->hasIndex('exam_results', 'er_exam_student_index')) {
                $table->index(['exam_id', 'student_id'], 'er_exam_student_index');
            }
            if (!$this->hasIndex('exam_results', 'er_exam_subject_index')) {
                $table->index(['exam_id', 'subject_id'], 'er_exam_subject_index');
            }
        });

        // ── staff_payrolls ───────────────────────────────────────────────────
        // Reports filter by year + month across all staff
        Schema::table('staff_payrolls', function (Blueprint $table) {
            if (!$this->hasIndex('staff_payrolls', 'sp_year_month_index')) {
                $table->index(['year', 'month'], 'sp_year_month_index');
            }
            if (!$this->hasIndex('staff_payrolls', 'sp_status_index')) {
                $table->index('status', 'sp_status_index');
            }
        });

        // ── leave_requests ───────────────────────────────────────────────────
        Schema::table('leave_requests', function (Blueprint $table) {
            if (!$this->hasIndex('leave_requests', 'lr_user_status_index')) {
                $table->index(['user_id', 'status'], 'lr_user_status_index');
            }
            if (!$this->hasIndex('leave_requests', 'lr_dates_index')) {
                $table->index(['leave_from', 'leave_to'], 'lr_dates_index');
            }
        });

        // ── online_exam_attempts ─────────────────────────────────────────────
        // Reports look up by exam + student, filtered by status
        Schema::table('online_exam_attempts', function (Blueprint $table) {
            if (!$this->hasIndex('online_exam_attempts', 'oea_exam_student_index')) {
                $table->index(['online_exam_id', 'student_id'], 'oea_exam_student_index');
            }
            if (!$this->hasIndex('online_exam_attempts', 'oea_status_index')) {
                $table->index('status', 'oea_status_index');
            }
        });

        // ── sms_logs / email_logs ────────────────────────────────────────────
        // Log pages filter by date
        Schema::table('sms_logs', function (Blueprint $table) {
            if (!$this->hasIndex('sms_logs', 'sms_logs_date_index')) {
                $table->index('created_at', 'sms_logs_date_index');
            }
        });

        Schema::table('email_logs', function (Blueprint $table) {
            if (!$this->hasIndex('email_logs', 'email_logs_date_index')) {
                $table->index('created_at', 'email_logs_date_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndexIfExists('users_role_index');
            $table->dropIndexIfExists('users_staff_id_index');
            $table->dropIndexIfExists('users_admission_no_index');
            $table->dropIndexIfExists('users_role_active_index');
            $table->dropIndexIfExists('users_class_section_index');
        });

        Schema::table('staff_attendances', function (Blueprint $table) {
            $table->dropIndexIfExists('sa_date_index');
            $table->dropIndexIfExists('sa_user_date_index');
        });

        Schema::table('student_attendances', function (Blueprint $table) {
            $table->dropIndexIfExists('stu_att_date_index');
            $table->dropIndexIfExists('stu_att_student_date_index');
        });

        Schema::table('fee_payments', function (Blueprint $table) {
            $table->dropIndexIfExists('fp_date_index');
            $table->dropIndexIfExists('fp_payment_mode_index');
        });

        Schema::table('student_fee_masters', function (Blueprint $table) {
            $table->dropIndexIfExists('sfm_session_index');
            $table->dropIndexIfExists('sfm_student_session_index');
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropIndexIfExists('er_exam_student_index');
            $table->dropIndexIfExists('er_exam_subject_index');
        });

        Schema::table('staff_payrolls', function (Blueprint $table) {
            $table->dropIndexIfExists('sp_year_month_index');
            $table->dropIndexIfExists('sp_status_index');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndexIfExists('lr_user_status_index');
            $table->dropIndexIfExists('lr_dates_index');
        });

        Schema::table('online_exam_attempts', function (Blueprint $table) {
            $table->dropIndexIfExists('oea_exam_student_index');
            $table->dropIndexIfExists('oea_status_index');
        });

        Schema::table('sms_logs', function (Blueprint $table) {
            $table->dropIndexIfExists('sms_logs_date_index');
        });

        Schema::table('email_logs', function (Blueprint $table) {
            $table->dropIndexIfExists('email_logs_date_index');
        });
    }

    /**
     * Check if an index already exists on the table.
     * Uses Laravel 11's native Schema::getIndexes() — no Doctrine required.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }
        }
        return false;
    }
};
