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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'appraisal_achievements')) {
                $table->text('appraisal_achievements')->nullable();
            }
            if (!Schema::hasColumn('users', 'general_behaviour')) {
                $table->string('general_behaviour')->nullable();
            }
            if (!Schema::hasColumn('users', 'second_language')) {
                $table->string('second_language')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'appraisal_achievements',
                'general_behaviour',
                'second_language',
            ]);
        });
    }
};
