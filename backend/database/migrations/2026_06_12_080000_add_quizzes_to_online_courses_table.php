<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('online_courses', function (Blueprint $table) {
            $table->json('quizzes')->nullable()->after('live_classes');
        });
    }

    public function down()
    {
        Schema::table('online_courses', function (Blueprint $table) {
            $table->dropColumn('quizzes');
        });
    }
};
