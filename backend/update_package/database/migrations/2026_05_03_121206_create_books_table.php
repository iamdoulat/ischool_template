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
        Schema::create('books', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('title');
            $blueprint->text('description')->nullable();
            $blueprint->string('book_number')->unique();
            $blueprint->string('isbn_number')->nullable();
            $blueprint->string('publisher')->nullable();
            $blueprint->string('author')->nullable();
            $blueprint->string('subject')->nullable();
            $blueprint->string('rack_number')->nullable();
            $blueprint->integer('qty')->default(0);
            $blueprint->integer('available')->default(0);
            $blueprint->decimal('price', 10, 2)->default(0);
            $blueprint->date('post_date')->nullable();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
