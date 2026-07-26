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
        Schema::create('homework_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('homework_id')->constrained('homeworks')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->text('student_answer')->nullable();
            $table->string('submission_file')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('marks_obtained', 8, 2)->nullable();
            $table->date('evaluation_date')->nullable();
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'submitted', 'evaluated'])->default('pending');
            $table->text('teacher_remarks')->nullable();
            $table->timestamps();

            // A student can only have one submission per homework
            $table->unique(['homework_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('homework_submissions');
    }
};
