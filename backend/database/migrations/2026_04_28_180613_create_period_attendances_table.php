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
        Schema::create('period_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->date('attendance_date');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->enum('attendance', ['present', 'late', 'absent', 'holiday', 'half_day']);
            $table->text('note')->nullable();
            $table->timestamps();
            
            $table->unique(['student_id', 'attendance_date', 'subject_id'], 'period_attendance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('period_attendances');
    }
};
