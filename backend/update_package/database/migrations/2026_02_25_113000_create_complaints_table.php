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
        Schema::create('complaints', function (Blueprint $col) {
            $col->id();
            $col->string('complaint_type')->nullable();
            $col->string('source')->nullable();
            $col->string('complain_by');
            $col->string('phone')->nullable();
            $col->date('date')->nullable();
            $col->text('description')->nullable();
            $col->string('action_taken')->nullable();
            $col->string('assigned')->nullable();
            $col->text('note')->nullable();
            $col->string('attachment')->nullable();
            $col->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
