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
        Schema::table('general_settings', function (Blueprint $table) {
            $table->boolean('auto_student_id')->default(false);
            $table->string('student_id_prefix')->nullable();
            $table->integer('student_no_digit')->default(4);
            $table->string('student_id_start_from')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn(['auto_student_id', 'student_id_prefix', 'student_no_digit', 'student_id_start_from']);
        });
    }
};
