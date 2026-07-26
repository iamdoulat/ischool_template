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
        Schema::create('lesson_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_timetable_id')->constrained('class_timetables')->onDelete('cascade');
            $table->date('date');
            $table->string('lesson');
            $table->string('topic');
            $table->text('sub_topic')->nullable();
            $table->text('presentation')->nullable();
            $table->text('objectives')->nullable();
            $table->string('attachment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_plans');
    }
};
