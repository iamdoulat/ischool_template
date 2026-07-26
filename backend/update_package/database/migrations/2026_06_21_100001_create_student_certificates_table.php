<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('header_left')->nullable();
            $table->string('header_center')->nullable();
            $table->string('header_right')->nullable();
            $table->text('body_text')->nullable();
            $table->string('footer_left')->nullable();
            $table->string('footer_center')->nullable();
            $table->string('footer_right')->nullable();

            // Design dimensions
            $table->string('header_height')->nullable();
            $table->string('footer_height')->nullable();
            $table->string('body_height')->nullable();
            $table->string('body_width')->nullable();

            $table->boolean('enable_student_photo')->default(false);
            $table->string('background_image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_certificates');
    }
};
