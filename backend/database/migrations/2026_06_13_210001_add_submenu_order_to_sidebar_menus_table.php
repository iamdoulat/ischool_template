<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sidebar_menus', function (Blueprint $table) {
            $table->json('submenu_order')->nullable()->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::table('sidebar_menus', function (Blueprint $table) {
            $table->dropColumn('submenu_order');
        });
    }
};
