<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_form_settings', function (Blueprint $table) {
            $table->id();
            $table->longText('fee_policy')->nullable();
            $table->longText('office_use_only')->nullable();
            $table->longText('terms_conditions')->nullable();
            $table->longText('declaration')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_form_settings');
    }
};
