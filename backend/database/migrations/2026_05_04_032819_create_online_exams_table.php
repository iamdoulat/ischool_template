<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('online_exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->boolean('is_quiz')->default(false);
            $table->dateTime('exam_from');
            $table->dateTime('exam_to');
            $table->string('duration'); // Format HH:MM:SS
            $table->integer('attempt')->default(1);
            $table->integer('passing_percentage')->default(33);
            $table->boolean('is_published')->default(false);
            $table->boolean('is_result_published')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Pivot table for Questions
        Schema::create('online_exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('online_exam_id')->constrained('online_exams')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->integer('marks')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_exam_questions');
        Schema::dropIfExists('online_exams');
    }
};
