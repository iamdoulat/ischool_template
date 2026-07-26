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
            $table->string('theme_mode')->default('light');
            $table->string('skins')->default('shadow');
            $table->string('side_menu')->default('expanded');
            $table->string('primary_color')->default('#4f46e5');
            $table->string('box_content')->default('wide');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn(['theme_mode', 'skins', 'side_menu', 'primary_color', 'box_content']);
        });
    }
};
