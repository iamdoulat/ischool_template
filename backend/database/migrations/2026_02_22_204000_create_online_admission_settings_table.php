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
        Schema::create('online_admission_settings', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->boolean('online_admission')->default(true);
            $blueprint->boolean('online_admission_payment_option')->default(true);
            $blueprint->decimal('online_admission_form_fees', 10, 2)->default(100.00);
            $blueprint->text('instructions')->nullable();
            $blueprint->text('terms_conditions')->nullable();
            $blueprint->string('admission_form_path')->nullable();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_admission_settings');
    }
};
