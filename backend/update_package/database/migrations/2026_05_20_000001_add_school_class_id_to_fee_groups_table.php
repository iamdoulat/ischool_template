<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_groups', function (Blueprint $table) {
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('fee_groups', function (Blueprint $table) {
            $table->dropForeign(['school_class_id']);
            $table->dropColumn('school_class_id');
        });
    }
};
