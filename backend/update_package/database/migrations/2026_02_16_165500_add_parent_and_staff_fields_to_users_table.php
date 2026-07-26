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
        Schema::table('users', function (Blueprint $table) {
            $table->string('guardian_name')->nullable()->after('father_name');
            $table->string('guardian_phone')->nullable()->after('guardian_name');
            $table->string('staff_id')->nullable()->after('id');
            $table->string('designation')->nullable()->after('father_name');
            $table->string('department')->nullable()->after('designation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['guardian_name', 'guardian_phone', 'staff_id', 'designation', 'department']);
        });
    }
};
