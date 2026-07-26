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
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('belongs_to'); // student | staff | transfer_certificate
            $table->string('field_type');  // input | textarea | select | checkbox | date
            $table->string('name');
            $table->unsignedTinyInteger('grid')->default(12);
            $table->text('field_values')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('visible_on_table')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
