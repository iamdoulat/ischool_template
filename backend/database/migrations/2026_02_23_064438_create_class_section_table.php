<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('class_section', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->onDelete('cascade');
            $table->foreignId('section_id')->constrained('sections')->onDelete('cascade');
            $table->unique(['school_class_id', 'section_id']);
            $table->timestamps();
        });

        // Migrate existing data: copy school_class_id links from sections into pivot
        $existing = DB::table('sections')
            ->whereNotNull('school_class_id')
            ->select('id', 'school_class_id')
            ->get();

        foreach ($existing as $row) {
            DB::table('class_section')->insertOrIgnore([
                'school_class_id' => $row->school_class_id,
                'section_id' => $row->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('class_section');
    }
};
