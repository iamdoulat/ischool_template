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
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->foreignId('student_fee_master_id')->nullable()->change();
            $table->foreignId('student_transport_fee_id')->nullable()->after('student_fee_master_id')->constrained('student_transport_fees')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->foreignId('student_fee_master_id')->nullable(false)->change();
            $table->dropForeign(['student_transport_fee_id']);
            $table->dropColumn('student_transport_fee_id');
        });
    }
};
