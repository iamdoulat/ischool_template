<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('marksheet_template_id')
                  ->nullable()
                  ->constrained('marksheet_templates')
                  ->onDelete('set null')
                  ->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\MarksheetTemplate::class);
            $table->dropColumn('marksheet_template_id');
        });
    }
};
