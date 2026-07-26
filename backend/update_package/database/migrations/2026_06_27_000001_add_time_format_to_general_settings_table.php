<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('general_settings', 'time_format')) {
            Schema::table('general_settings', function (Blueprint $table) {
                $table->string('time_format')->nullable()->default('12');
            });
        }
    }

    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn('time_format');
        });
    }
};
