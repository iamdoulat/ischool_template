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
        Schema::create('fee_masters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_group_id')->constrained('fee_groups')->onDelete('cascade');
            $table->foreignId('fee_type_id')->constrained('fee_types')->onDelete('cascade');
            $table->date('due_date');
            $table->decimal('amount', 10, 2);
            $table->string('fine_type')->default('none'); // none, percentage, fix, cumulative
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
        Schema::dropIfExists('fee_masters');
    }
};
