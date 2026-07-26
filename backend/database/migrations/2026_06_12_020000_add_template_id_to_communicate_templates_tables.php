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
        Schema::table('email_templates', function (Blueprint $table) {
            $table->string('template_id')->nullable()->after('id');
        });

        Schema::table('sms_templates', function (Blueprint $table) {
            $table->string('template_id')->nullable()->after('id');
        });

        Schema::table('wa_templates', function (Blueprint $table) {
            $table->string('template_id')->nullable()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropColumn('template_id');
        });

        Schema::table('sms_templates', function (Blueprint $table) {
            $table->dropColumn('template_id');
        });

        Schema::table('wa_templates', function (Blueprint $table) {
            $table->dropColumn('template_id');
        });
    }
};
