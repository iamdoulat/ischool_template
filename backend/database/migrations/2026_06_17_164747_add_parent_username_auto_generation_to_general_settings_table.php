<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('general_settings', 'auto_parent_username')) {
            Schema::table('general_settings', function (Blueprint $table) {
                $table->boolean('auto_parent_username')->default(false);
                $table->string('parent_username_prefix')->nullable();
                $table->integer('parent_username_digit')->default(4);
                $table->string('parent_username_start_from')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'auto_parent_username',
                'parent_username_prefix',
                'parent_username_digit',
                'parent_username_start_from',
            ]);
        });
    }
};
