<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('live_meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('date_time');
            $table->string('api_used')->default('Global'); // Global or Self
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->integer('total_join')->default(0);
            $table->string('meeting_id')->nullable();
            $table->string('join_url')->nullable();
            $table->string('status')->default('pending'); // pending, finished, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_meetings');
    }
};
