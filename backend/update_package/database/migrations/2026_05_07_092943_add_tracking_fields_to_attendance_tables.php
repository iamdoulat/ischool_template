<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_attendances', function (Blueprint $table) {
            $table->string('source')->default('Manual')->after('attendance');
            $table->string('ip_address')->nullable()->after('note');
            $table->string('user_agent')->nullable()->after('ip_address');
            $table->string('device_serial')->nullable()->after('user_agent');
            $table->string('scan_location')->nullable()->after('device_serial');
        });

        Schema::table('staff_attendances', function (Blueprint $table) {
            $table->string('ip_address')->nullable()->after('note');
            $table->string('user_agent')->nullable()->after('ip_address');
            $table->string('device_serial')->nullable()->after('user_agent');
            $table->string('scan_location')->nullable()->after('device_serial');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_attendances', function (Blueprint $table) {
            $table->dropColumn(['source', 'ip_address', 'user_agent', 'device_serial', 'scan_location']);
        });

        Schema::table('staff_attendances', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'user_agent', 'device_serial', 'scan_location']);
        });
    }
};
