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
        Schema::create('daily_assignments', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $blueprint->foreignId('class_id')->constrained('school_classes')->onDelete('cascade');
            $blueprint->foreignId('section_id')->constrained('sections')->onDelete('cascade');
            $blueprint->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $blueprint->string('title');
            $blueprint->text('description')->nullable();
            $blueprint->date('submission_date');
            $blueprint->date('evaluation_date')->nullable();
            $blueprint->foreignId('evaluated_by')->nullable()->constrained('users')->onDelete('set null');
            $blueprint->string('attachment')->nullable();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_assignments');
    }
};
