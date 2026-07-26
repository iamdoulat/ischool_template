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
            $table->string('ip_camera_url')->nullable();
            $table->boolean('notify_in')->default(true);
            $table->boolean('notify_out')->default(true);
            $table->boolean('notify_sms')->default(false);
            $table->boolean('notify_whatsapp')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('qr_attendance_settings', function (Blueprint $table) {
            $table->dropColumn(['ip_camera_url', 'notify_in', 'notify_out', 'notify_sms', 'notify_whatsapp']);
        });
    }
};
