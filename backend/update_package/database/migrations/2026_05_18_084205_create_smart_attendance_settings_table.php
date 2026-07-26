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
        Schema::create('smart_attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_face_enabled')->default(true);
            $table->boolean('is_qr_enabled')->default(true);
            $table->boolean('is_nfc_enabled')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smart_attendance_settings');
    }
};
