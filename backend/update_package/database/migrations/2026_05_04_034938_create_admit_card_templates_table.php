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
        Schema::dropIfExists('admit_card_templates');
        
        Schema::create('admit_card_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('heading')->nullable();
            $table->string('title')->nullable();
            $table->string('exam_name')->nullable();
            $table->string('school_name')->nullable();
            $table->string('exam_center')->nullable();
            $table->text('footer_text')->nullable();
            
            // Images
            $table->string('header_image')->nullable();
            $table->string('left_logo')->nullable();
            $table->string('right_logo')->nullable();
            $table->string('left_sign')->nullable();
            $table->string('middle_sign')->nullable();
            $table->string('right_sign')->nullable();
            $table->string('background_image')->nullable();
            
            // Display Options (Toggles)
            $table->boolean('show_name')->default(true);
            $table->boolean('show_father_name')->default(true);
            $table->boolean('show_mother_name')->default(true);
            $table->boolean('show_dob')->default(true);
            $table->boolean('show_admission_no')->default(true);
            $table->boolean('show_roll_no')->default(true);
            $table->boolean('show_address')->default(true);
            $table->boolean('show_gender')->default(true);
            $table->boolean('show_photo')->default(true);
            $table->boolean('show_class')->default(true);
            $table->boolean('show_section')->default(true);
            $table->boolean('show_exam_number')->default(true);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admit_card_templates');
    }
};
