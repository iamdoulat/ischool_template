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
        Schema::create('file_upload_settings', function (Blueprint $table) {
            $table->id();
            $table->text('file_extension')->nullable();
            $table->text('file_mime')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->text('image_extension')->nullable();
            $table->text('image_mime')->nullable();
            $table->unsignedBigInteger('image_size')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_upload_settings');
    }
};
