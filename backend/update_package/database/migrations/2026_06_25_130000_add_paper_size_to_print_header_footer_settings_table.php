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
        Schema::table('print_header_footer_settings', function (Blueprint $table) {
            $table->enum('paper_size', ['A4', 'A5', 'Legal'])->default('A4')->after('footer_content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('print_header_footer_settings', function (Blueprint $table) {
            $table->dropColumn('paper_size');
        });
    }
};
