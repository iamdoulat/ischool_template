<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('course_settings', function (Blueprint $table) {
            $table->id();
            // Curriculum
            $table->boolean('quiz')->default(true);
            $table->boolean('exam')->default(true);
            $table->boolean('assignment')->default(true);
            
            // AWS S3
            $table->string('aws_access_key_id')->nullable();
            $table->string('aws_secret_access_key')->nullable();
            $table->string('aws_bucket_name')->nullable();
            $table->string('aws_region')->nullable();
            
            // Guest User
            $table->boolean('guest_login')->default(true);
            $table->string('guest_user_prefix')->default('Guest');
            $table->integer('guest_user_id_start')->default(100);
            
            $table->timestamps();
        });

        // Insert default setting
        DB::table('course_settings')->insert([
            'quiz' => true,
            'exam' => true,
            'assignment' => true,
            'guest_login' => true,
            'guest_user_prefix' => 'Guest',
            'guest_user_id_start' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('course_settings');
    }
};
