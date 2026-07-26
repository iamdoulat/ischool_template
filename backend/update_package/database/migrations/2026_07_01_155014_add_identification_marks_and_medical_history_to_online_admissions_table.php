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
        Schema::table('online_admissions', function (Blueprint $table) {
            $table->text('identification_marks')->nullable();
            $table->text('medical_history')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('online_admissions', function (Blueprint $table) {
            $table->dropColumn(['identification_marks', 'medical_history']);
        });
    }
};
