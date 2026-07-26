<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('general_settings', 'auto_username')) {
            Schema::table('general_settings', function (Blueprint $table) {
                $table->boolean('auto_username')->default(false);
                $table->string('username_prefix')->nullable();
                $table->integer('username_digit')->default(4);
                $table->string('username_start_from')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn(['auto_username', 'username_prefix', 'username_digit', 'username_start_from']);
        });
    }
};
