<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('general_settings', 'contact_form_receiver_email')) {
            Schema::table('general_settings', function (Blueprint $table) {
                $table->string('contact_form_receiver_email')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn('contact_form_receiver_email');
        });
    }
};
