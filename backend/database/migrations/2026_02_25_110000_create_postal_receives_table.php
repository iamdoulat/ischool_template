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
        Schema::create('postal_receives', function (Blueprint $col) {
            $col->id();
            $col->string('from_title');
            $col->string('reference_no')->nullable();
            $col->text('address')->nullable();
            $col->text('note')->nullable();
            $col->string('to_title')->nullable();
            $col->date('date')->nullable();
            $col->string('attachment')->nullable();
            $col->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('postal_receives');
    }
};
