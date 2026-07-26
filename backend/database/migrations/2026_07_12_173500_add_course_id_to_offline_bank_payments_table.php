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
        Schema::table('offline_bank_payments', function (Blueprint $table) {
            $table->unsignedBigInteger('course_id')->nullable()->after('student_fee_master_id');
            // We do not set a foreign key constraint explicitly if online_courses is in another context,
            // or we can add it if online_courses is standard.
            // Let's add the column simply for now to avoid constraint errors if online_courses isn't strictly standard.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offline_bank_payments', function (Blueprint $table) {
            $table->dropColumn('course_id');
        });
    }
};
