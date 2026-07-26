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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('class_name');
            $table->string('section');
            $table->string('subject');
            $table->string('question_type'); // Single Choice, Multiple Choice, True/False, Descriptive
            $table->string('level'); // Low, Medium, High
            $table->text('question');
            $table->json('options')->nullable(); // Store options as JSON
            $table->text('correct_answer')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
