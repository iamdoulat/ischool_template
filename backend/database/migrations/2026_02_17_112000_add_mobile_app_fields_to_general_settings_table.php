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
            $table->string('mobile_api_url')->nullable();
            $table->string('mobile_primary_color')->default('#424242');
            $table->string('mobile_secondary_color')->default('#E7F1EE');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn(['mobile_api_url', 'mobile_primary_color', 'mobile_secondary_color']);
        });
    }
};
