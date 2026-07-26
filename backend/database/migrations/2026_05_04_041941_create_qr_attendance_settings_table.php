<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('qr_attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('auto_attendance')->default(false);
            $table->boolean('use_sensor_device')->default(true);
            $table->boolean('use_camera_device')->default(true);
            $table->string('camera_type')->default('primary'); // primary or secondary
            $table->timestamps();
        });

        // Insert default setting
        \DB::table('qr_attendance_settings')->insert([
            'auto_attendance' => false,
            'use_sensor_device' => true,
            'use_camera_device' => true,
            'camera_type' => 'primary',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_attendance_settings');
    }
};
