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
            $table->string('attendance_type')->default('day_wise');
            $table->boolean('biometric_attendance')->default(false);
            $table->string('devices')->nullable();
            $table->decimal('low_attendance_limit', 5, 2)->default(75.00);
            $table->json('staff_attendance_settings')->nullable();
            $table->json('student_attendance_settings')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'attendance_type',
                'biometric_attendance',
                'devices',
                'low_attendance_limit',
                'staff_attendance_settings',
                'student_attendance_settings'
            ]);
        });
    }
};
