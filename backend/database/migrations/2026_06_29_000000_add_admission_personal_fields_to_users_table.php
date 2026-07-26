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
            $table->string('birth_place')->nullable()->after('dob');
            $table->string('state')->nullable()->after('birth_place');
            $table->string('nationality')->nullable()->after('state');
            $table->string('postal_code', 20)->nullable()->after('current_address');
            $table->string('mother_tongue')->nullable()->after('postal_code');
            $table->text('identification_marks')->nullable()->after('mother_tongue');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'birth_place',
                'state',
                'nationality',
                'postal_code',
                'mother_tongue',
                'identification_marks',
            ]);
        });
    }
};
