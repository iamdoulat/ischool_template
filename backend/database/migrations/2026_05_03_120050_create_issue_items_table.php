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
        Schema::create('issue_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_category_id')->constrained('item_categories')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->string('user_type'); // staff, student
            $table->unsignedBigInteger('issue_to');
            $table->unsignedBigInteger('issue_by');
            $table->date('issue_date');
            $table->date('return_date')->nullable();
            $table->integer('quantity');
            $table->text('note')->nullable();
            $table->enum('status', ['issued', 'returned'])->default('issued');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_items');
    }
};
