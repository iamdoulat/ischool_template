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
        Schema::create('print_header_footer_settings', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique(); // Fees Receipt, Payslip, etc.
            $table->string('header_image_path')->nullable();
            $table->text('footer_content')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('print_header_footer_settings');
    }
};
