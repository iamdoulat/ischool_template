<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('class_timetables', function (Blueprint $table) {
            $table->foreignId('subject_group_id')->nullable()->after('section_id')->constrained('subject_groups')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('class_timetables', function (Blueprint $table) {
            $table->dropForeign(['subject_group_id']);
            $table->dropColumn('subject_group_id');
        });
    }
};
