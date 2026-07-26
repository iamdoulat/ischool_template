<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->string('member_id');
            $table->string('library_card_no');
            $table->string('member_type')->default('Student'); // Student | Staff
            $table->string('admission_no')->nullable();
            $table->string('issued_by')->nullable();           // name + id
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();           // null = not yet returned
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_issues');
    }
};
