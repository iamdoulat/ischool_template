<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('email_logs', 'original_filename')) {
            Schema::table('email_logs', function (Blueprint $table) {
                $table->string('original_filename')->nullable()->after('attachment');
            });
        }
    }

    public function down(): void
    {
        Schema::table('email_logs', function (Blueprint $table) {
            $table->dropColumn('original_filename');
        });
    }
};
