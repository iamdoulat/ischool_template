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
        Schema::create('phone_call_logs', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('phone', 20);
            $table->date('date');
            $table->text('description')->nullable();
            $table->date('next_follow_up_date')->nullable();
            $table->string('call_duration')->nullable();
            $table->text('note')->nullable();
            $table->enum('call_type', ['Incoming', 'Outgoing'])->default('Incoming');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phone_call_logs');
    }
};
