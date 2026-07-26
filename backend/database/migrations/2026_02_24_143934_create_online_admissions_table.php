<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('online_admissions', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->onDelete('set null');
            $table->foreignId('section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->date('dob')->nullable();
            $table->string('gender')->nullable();
            $table->string('category')->nullable();
            $table->string('religion')->nullable();
            $table->string('caste')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('student_photo')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('house')->nullable();
            $table->string('height')->nullable();
            $table->string('weight')->nullable();
            $table->date('measurement_date')->nullable();

            // Parent info
            $table->string('father_name')->nullable();
            $table->string('father_phone')->nullable();
            $table->string('father_occupation')->nullable();
            $table->string('father_photo')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_phone')->nullable();
            $table->string('mother_occupation')->nullable();
            $table->string('mother_photo')->nullable();

            // Guardian info
            $table->string('guardian_type')->nullable(); // father, mother, other
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relation')->nullable();
            $table->string('guardian_phone')->nullable();
            $table->string('guardian_email')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->string('guardian_photo')->nullable();
            $table->text('guardian_address')->nullable();

            // Addresses
            $table->text('current_address')->nullable();
            $table->text('permanent_address')->nullable();

            // Status
            $table->string('form_status')->default('Not Submitted'); // Not Submitted, Submitted
            $table->string('payment_status')->default('Unpaid'); // Paid, Unpaid
            $table->boolean('is_enrolled')->default(false);

            $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_admissions');
    }
};
