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
        Schema::table('exam_results', function (Blueprint $table) {
            $table->decimal('theory_marks', 8, 2)->nullable()->after('marks');
            $table->decimal('practical_marks', 8, 2)->nullable()->after('theory_marks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropColumn(['theory_marks', 'practical_marks']);
        });
    }
};
