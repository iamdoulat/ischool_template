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
        Schema::create('transport_fee_masters', function (Blueprint $table) {
            $table->id();
            $table->string('month'); // e.g., April, May
            $table->date('due_date')->nullable();
            $table->string('fine_type')->default('none'); // none, percentage, fix
            $table->decimal('fine_percentage', 5, 2)->nullable();
            $table->decimal('fine_amount', 10, 2)->nullable();
            $table->foreignId('session_id')->nullable()->constrained('academic_sessions')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transport_fee_masters');
    }
};
