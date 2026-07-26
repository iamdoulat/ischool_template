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
            $table->string('middle_name')->nullable()->after('name');
            $table->string('guardian_type')->nullable()->after('mother_photo');
            $table->text('current_address')->nullable()->after('guardian_address');
            $table->text('permanent_address')->nullable()->after('current_address');
            $table->string('bank_account_no')->nullable()->after('permanent_address');
            $table->string('bank_name')->nullable()->after('bank_account_no');
            $table->string('ifsc_code')->nullable()->after('bank_name');
            $table->string('national_identification_no')->nullable()->after('ifsc_code');
            $table->string('local_identification_no')->nullable()->after('national_identification_no');
            $table->string('rte')->nullable()->default('No')->after('local_identification_no');
            $table->text('previous_school_details')->nullable()->after('rte');
            $table->text('note')->nullable()->after('previous_school_details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'middle_name',
                'guardian_type',
                'current_address',
                'permanent_address',
                'bank_account_no',
                'bank_name',
                'ifsc_code',
                'national_identification_no',
                'local_identification_no',
                'rte',
                'previous_school_details',
                'note'
            ]);
        });
    }
};
