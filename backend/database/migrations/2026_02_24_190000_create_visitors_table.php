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
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->string('purpose');
            $table->string('meeting_with'); // e.g. "Staff (Name)" or "Student (Name)"
            $table->string('visitor_name');
            $table->string('phone', 20);
            $table->string('id_card')->nullable();
            $table->integer('number_of_person')->default(1);
            $table->date('date');
            $table->time('in_time');
            $table->time('out_time')->nullable();
            $table->text('note')->nullable();
            $table->string('attachment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
