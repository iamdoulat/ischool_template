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
        Schema::table('qr_attendance_settings', function (Blueprint $table) {
            $table->string('ip_camera_brand')->default('generic')->after('ip_camera_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('qr_attendance_settings', function (Blueprint $table) {
            $table->dropColumn(['ip_camera_brand']);
        });
    }
};
