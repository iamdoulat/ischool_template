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
            $table->boolean('student_login')->default(true);
            $table->boolean('parent_login')->default(true);
            $table->boolean('student_login_admission_no')->default(true);
            $table->boolean('student_login_mobile_no')->default(false);
            $table->boolean('student_login_email')->default(false);
            $table->boolean('parent_login_mobile_no')->default(true);
            $table->boolean('parent_login_email')->default(false);
            $table->boolean('allow_student_to_add_timeline')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'student_login',
                'parent_login',
                'student_login_admission_no',
                'student_login_mobile_no',
                'student_login_email',
                'parent_login_mobile_no',
                'parent_login_email',
                'allow_student_to_add_timeline'
            ]);
        });
    }
};
