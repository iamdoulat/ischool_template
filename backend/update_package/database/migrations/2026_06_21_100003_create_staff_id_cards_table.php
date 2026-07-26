<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_id_cards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('school_name')->nullable();
            $table->string('school_address')->nullable();
            $table->string('header_color')->nullable();
            $table->string('background_image')->nullable();
            $table->string('logo')->nullable();
            $table->string('signature')->nullable();
            $table->enum('design_type', ['Horizontal', 'Vertical'])->default('Horizontal');

            // Toggle fields
            $table->boolean('show_staff_name')->default(true);
            $table->boolean('show_staff_id')->default(true);
            $table->boolean('show_designation')->default(true);
            $table->boolean('show_department')->default(true);
            $table->boolean('show_father_name')->default(false);
            $table->boolean('show_mother_name')->default(false);
            $table->boolean('show_joining_date')->default(false);
            $table->boolean('show_address')->default(false);
            $table->boolean('show_phone')->default(true);
            $table->boolean('show_dob')->default(false);
            $table->boolean('show_qr')->default(false);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_id_cards');
    }
};
