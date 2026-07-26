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
        Schema::table('daily_assignments', function (Blueprint $table) {
            $table->decimal('marks_obtained', 8, 2)->nullable()->after('evaluated_by');
            $table->enum('status', ['pending', 'submitted', 'evaluated'])->default('pending')->after('marks_obtained');
            $table->text('student_answer')->nullable()->after('status');
            $table->string('submission_file')->nullable()->after('student_answer');
            $table->timestamp('submitted_at')->nullable()->after('submission_file');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_assignments', function (Blueprint $table) {
            $table->dropColumn(['marks_obtained', 'status', 'student_answer', 'submission_file', 'submitted_at']);
        });
    }
};
