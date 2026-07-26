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
        Schema::create('shared_contents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('send_to');
            $table->date('share_date');
            $table->date('valid_upto')->nullable();
            $table->foreignId('shared_by')->constrained('users')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shared_contents');
    }
};
