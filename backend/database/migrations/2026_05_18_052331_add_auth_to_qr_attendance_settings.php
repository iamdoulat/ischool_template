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
            $table->boolean('ip_camera_auth_enabled')->default(false)->after('ip_camera_url');
            $table->string('ip_camera_username')->nullable()->after('ip_camera_auth_enabled');
            $table->string('ip_camera_password')->nullable()->after('ip_camera_username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('qr_attendance_settings', function (Blueprint $table) {
            $table->dropColumn([
                'ip_camera_auth_enabled',
                'ip_camera_username',
                'ip_camera_password'
            ]);
        });
    }
};
