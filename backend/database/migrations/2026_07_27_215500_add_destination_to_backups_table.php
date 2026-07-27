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
        if (Schema::hasTable('backups') && !Schema::hasColumn('backups', 'destination')) {
            Schema::table('backups', function (Blueprint $table) {
                $table->string('destination')->default('local')->after('size');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('backups') && Schema::hasColumn('backups', 'destination')) {
            Schema::table('backups', function (Blueprint $table) {
                $table->dropColumn('destination');
            });
        }
    }
};
