<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('behaviour_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('student_comment')->default(true);
            $table->boolean('parent_comment')->default(true);
            $table->timestamps();
        });

        // Insert default setting
        DB::table('behaviour_settings')->insert([
            'student_comment' => true,
            'parent_comment' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('behaviour_settings');
    }
};
