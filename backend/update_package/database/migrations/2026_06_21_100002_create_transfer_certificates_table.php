<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('tc_number')->unique();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_class_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable();
            $table->string('student_name')->nullable();
            $table->string('admission_no')->nullable();
            $table->text('reason')->nullable();
            $table->date('issue_date')->nullable();
            $table->boolean('is_reissue')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_certificates');
    }
};
