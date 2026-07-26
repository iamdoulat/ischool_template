<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fee_reminders', function (Blueprint $row) {
            $row->id();
            $row->string('type'); // Before, After
            $row->integer('days');
            $row->boolean('is_active')->default(false);
            $row->timestamps();
        });

        // Insert default values
        DB::table('fee_reminders')->insert([
            ['type' => 'Before', 'days' => 2, 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'Before', 'days' => 5, 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'After', 'days' => 2, 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'After', 'days' => 5, 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_reminders');
    }
};
