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
        Schema::table('online_admissions', function (Blueprint $table) {
            $table->string('national_identification_no')->nullable();
            $table->string('local_identification_no')->nullable();
            $table->string('birth_place')->nullable();
            $table->string('state')->nullable();
            $table->string('nationality')->nullable();
            $table->string('mother_tongue')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('ifsc_code')->nullable();
            $table->text('previous_school_details')->nullable();
            $table->json('previous_academic_record')->nullable();
            $table->text('note')->nullable();
            $table->string('rte')->default('No');
            $table->text('appraisal_achievements')->nullable();
            $table->string('general_behaviour')->nullable();
            $table->string('second_language')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('online_admissions', function (Blueprint $table) {
            $table->dropColumn([
                'national_identification_no',
                'local_identification_no',
                'birth_place',
                'state',
                'nationality',
                'mother_tongue',
                'postal_code',
                'bank_account_no',
                'bank_name',
                'ifsc_code',
                'previous_school_details',
                'previous_academic_record',
                'note',
                'rte',
                'appraisal_achievements',
                'general_behaviour',
                'second_language'
            ]);
        });
    }
};
