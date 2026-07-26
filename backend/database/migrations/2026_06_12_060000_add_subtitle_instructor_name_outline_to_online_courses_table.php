<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('online_courses', function (Blueprint $table) {
            $table->string('subtitle')->nullable()->after('title');
            $table->string('instructor_name')->nullable()->after('instructor_id');
            $table->json('outline')->nullable()->after('image');
        });
    }

    public function down()
    {
        Schema::table('online_courses', function (Blueprint $table) {
            $table->dropColumn(['subtitle', 'instructor_name', 'outline']);
        });
    }
};
