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
        Schema::table('fee_masters', function (Blueprint $table) {
            $table->boolean('fine_per_day')->default(false)->after('fine_amount');
            $table->json('fine_tiers')->nullable()->after('fine_per_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fee_masters', function (Blueprint $table) {
            $table->dropColumn(['fine_per_day', 'fine_tiers']);
        });
    }
};
