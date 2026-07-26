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
        Schema::create('admission_enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->text('description')->nullable();
            $table->text('note')->nullable();
            $table->date('date');
            $table->date('next_follow_up_date')->nullable();
            $table->string('assigned')->nullable();
            $table->string('reference')->nullable();
            $table->string('source')->nullable();
            $table->foreignId('class_id')->nullable();
            $table->integer('no_of_child')->default(1);
            $table->enum('status', ['Active', 'Passive', 'Dead'])->default('Active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admission_enquiries');
    }
};
