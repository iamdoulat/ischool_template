<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('notices', 'notify_to')) {
            Schema::table('notices', function (Blueprint $table) {
                $table->string('notify_to')->nullable()->after('message_to');
            });
        }
    }

    public function down(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            $table->dropColumn('notify_to');
        });
    }
};
