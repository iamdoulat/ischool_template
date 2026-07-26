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
        Schema::create('zkteco_attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device_serial');
            $table->string('user_pin');
            $table->timestamp('punch_time');
            $table->string('verify_type')->default('1'); // 1=Fingerprint, 15=NFC/Card, etc.
            $table->string('status_code')->default('0'); // 0=In, 1=Out
            $table->foreignId('student_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->boolean('processed')->default(true);
            $table->string('status')->default('matched'); // matched, unmatched
            $table->timestamps();

            $table->index(['device_serial', 'punch_time']);
            $table->index(['user_pin']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zkteco_attendance_logs');
    }
};
