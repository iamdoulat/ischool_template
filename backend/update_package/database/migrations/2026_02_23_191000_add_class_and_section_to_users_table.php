<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('school_class_id')->nullable()->after('class')->constrained('school_classes')->onDelete('set null');
            $table->foreignId('section_id')->nullable()->after('school_class_id')->constrained('sections')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['school_class_id']);
            $table->dropForeign(['section_id']);
            $table->dropColumn(['school_class_id', 'section_id']);
        });
    }
};
