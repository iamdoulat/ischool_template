<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subject_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('school_class_id')->constrained('school_classes')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->onDelete('cascade');
            $table->timestamps();

            // Scope name unique per session and class
            $table->unique(['name', 'school_class_id', 'academic_session_id'], 'sg_name_class_session_unique');
        });

        // Pivot table for sections
        Schema::create('subject_group_section', function (Blueprint $table) {
            $table->foreignId('subject_group_id')->constrained('subject_groups')->onDelete('cascade');
            $table->foreignId('section_id')->constrained('sections')->onDelete('cascade');
            $table->primary(['subject_group_id', 'section_id']);
        });

        // Pivot table for subjects
        Schema::create('subject_group_subject', function (Blueprint $table) {
            $table->foreignId('subject_group_id')->constrained('subject_groups')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->primary(['subject_group_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_group_subject');
        Schema::dropIfExists('subject_group_section');
        Schema::dropIfExists('subject_groups');
    }
};
