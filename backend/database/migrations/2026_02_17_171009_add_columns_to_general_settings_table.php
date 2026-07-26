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
            // Google Drive
            $table->string('google_client_id')->nullable();
            $table->string('google_api_key')->nullable();
            $table->string('google_project_number')->nullable();
            $table->boolean('google_status')->default(false);
            $table->boolean('google_allow_student')->default(false);
            $table->boolean('google_allow_guardian')->default(false);
            $table->boolean('google_allow_staff')->default(false);

            // Whatsapp
            $table->boolean('whatsapp_front_site_status')->default(false);
            $table->string('whatsapp_front_site_mobile')->nullable();
            $table->time('whatsapp_front_site_from')->nullable();
            $table->time('whatsapp_front_site_to')->nullable();

            $table->boolean('whatsapp_admin_panel_status')->default(false);
            $table->string('whatsapp_admin_panel_mobile')->nullable();
            $table->time('whatsapp_admin_panel_from')->nullable();
            $table->time('whatsapp_admin_panel_to')->nullable();

            $table->boolean('whatsapp_student_panel_status')->default(false);
            $table->string('whatsapp_student_panel_mobile')->nullable();
            $table->time('whatsapp_student_panel_from')->nullable();
            $table->time('whatsapp_student_panel_to')->nullable();

            // Chat
            $table->boolean('chat_student_delete')->default(false);
            $table->boolean('chat_guardian_delete')->default(false);
            $table->boolean('chat_staff_delete')->default(false);

            // Maintenance
            $table->boolean('maintenance_mode')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'google_client_id',
                'google_api_key',
                'google_project_number',
                'google_status',
                'google_allow_student',
                'google_allow_guardian',
                'google_allow_staff',
                'whatsapp_front_site_status',
                'whatsapp_front_site_mobile',
                'whatsapp_front_site_from',
                'whatsapp_front_site_to',
                'whatsapp_admin_panel_status',
                'whatsapp_admin_panel_mobile',
                'whatsapp_admin_panel_from',
                'whatsapp_admin_panel_to',
                'whatsapp_student_panel_status',
                'whatsapp_student_panel_mobile',
                'whatsapp_student_panel_from',
                'whatsapp_student_panel_to',
                'chat_student_delete',
                'chat_guardian_delete',
                'chat_staff_delete',
                'maintenance_mode'
            ]);
        });
    }
};
