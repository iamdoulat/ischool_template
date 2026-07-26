<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('notification_settings', 'email_subject')) {
                $table->string('email_subject')->nullable();
            }
            if (!Schema::hasColumn('notification_settings', 'email_template')) {
                $table->text('email_template')->nullable();
            }
            if (!Schema::hasColumn('notification_settings', 'sms_template')) {
                $table->text('sms_template')->nullable();
            }
            if (!Schema::hasColumn('notification_settings', 'whatsapp_template')) {
                $table->text('whatsapp_template')->nullable();
            }
            if (!Schema::hasColumn('notification_settings', 'mobile_app_template')) {
                $table->text('mobile_app_template')->nullable();
            }
        });

        // Copy sample_message to new columns
        DB::statement('
            UPDATE notification_settings 
            SET email_template = sample_message, 
                sms_template = sample_message, 
                whatsapp_template = sample_message, 
                mobile_app_template = sample_message
            WHERE sample_message IS NOT NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->dropColumn([
                'email_subject',
                'email_template',
                'sms_template',
                'whatsapp_template',
                'mobile_app_template'
            ]);
        });
    }
};
