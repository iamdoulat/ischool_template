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
        Schema::create('homeworks', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('class_id')->constrained('school_classes')->onDelete('cascade');
            $blueprint->foreignId('section_id')->nullable()->constrained('sections')->onDelete('cascade');
            $blueprint->foreignId('subject_group_id')->nullable()->constrained('subject_groups')->onDelete('cascade');
            $blueprint->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $blueprint->date('homework_date');
            $blueprint->date('submission_date');
            $blueprint->date('evaluation_date')->nullable();
            $blueprint->text('description')->nullable();
            $blueprint->string('attachment')->nullable();
            $blueprint->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('homeworks');
    }
};
