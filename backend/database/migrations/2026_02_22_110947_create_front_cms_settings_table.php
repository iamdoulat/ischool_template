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
        Schema::create('front_cms_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_active')->default(true);
            $table->boolean('sidebar_active')->default(true);
            $table->boolean('rtl_mode')->default(false);
            $table->json('sidebar_options')->nullable();
            $table->string('language')->default('english');
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->string('footer_text')->nullable();
            $table->text('cookie_consent')->nullable();
            $table->text('google_analytics')->nullable();
            $table->json('social_media')->nullable();
            $table->string('current_theme')->default('material_pink');

            // Website Sections
            $table->json('about_us')->nullable();
            $table->json('main_courses')->nullable();
            $table->json('experienced_staffs')->nullable();
            $table->json('latest_notices')->nullable();
            $table->json('header_footer_sections')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('front_cms_settings');
    }
};
