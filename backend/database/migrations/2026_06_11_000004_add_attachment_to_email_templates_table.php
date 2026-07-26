<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('email_templates', 'attachment')) {
            Schema::table('email_templates', function (Blueprint $table) {
                $table->string('attachment')->nullable()->after('message');
                $table->string('original_filename')->nullable()->after('attachment');
            });
        }
    }

    public function down(): void
    {
        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropColumn(['attachment', 'original_filename']);
        });
    }
};
