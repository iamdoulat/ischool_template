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
        Schema::create('uploaded_contents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('content_type_id')->constrained('content_types')->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->foreignId('uploader_id')->constrained('users')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->date('share_date')->nullable();
            $table->date('valid_upto')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uploaded_contents');
    }
};
