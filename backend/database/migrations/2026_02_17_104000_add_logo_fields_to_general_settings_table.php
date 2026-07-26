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
        Schema::table('general_settings', function (Blueprint $table) {
            $table->string('print_logo')->nullable()->after('file_upload_path');
            $table->string('admin_logo')->nullable()->after('print_logo');
            $table->string('admin_small_logo')->nullable()->after('admin_logo');
            $table->string('app_logo')->nullable()->after('admin_small_logo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn(['print_logo', 'admin_logo', 'admin_small_logo', 'app_logo']);
        });
    }
};
