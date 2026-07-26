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
        Schema::create('zoom_settings', function (Blueprint $table) {
            $table->id();
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            $table->boolean('teacher_api_credential')->default(true);
            $table->string('staff_client_type')->default('web'); // web or app
            $table->string('student_client_type')->default('web'); // web or app
            $table->boolean('parent_live_class')->default(true);
            $table->text('access_token')->nullable();
            $table->timestamps();
        });

        // Insert default setting
        \DB::table('zoom_settings')->insert([
            'api_key' => 's4aABluGRXK5kj5JM1UQtg',
            'api_secret' => 'w0ELxqU7WGzH4q3knJ2Yh5DfAqRvBypB',
            'teacher_api_credential' => true,
            'staff_client_type' => 'web',
            'student_client_type' => 'web',
            'parent_live_class' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zoom_settings');
    }
};
