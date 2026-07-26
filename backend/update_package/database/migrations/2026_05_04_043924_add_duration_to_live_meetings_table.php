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
        Schema::table('live_meetings', function (Blueprint $table) {
            $table->integer('duration')->default(45)->after('date_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('live_meetings', function (Blueprint $table) {
            $table->dropColumn('duration');
        });
    }
};
