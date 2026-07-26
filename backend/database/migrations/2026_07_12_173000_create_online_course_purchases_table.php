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
        Schema::create('online_course_purchases', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('income_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('Offline');
            $table->date('payment_date');
            $table->string('invoice_no')->unique();
            $table->string('status')->default('Completed');
            $table->timestamps();
            
            // Foreign keys can be added if needed, assuming users and online_courses exist
            // $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            // $table->foreign('course_id')->references('id')->on('online_courses')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_course_purchases');
    }
};
