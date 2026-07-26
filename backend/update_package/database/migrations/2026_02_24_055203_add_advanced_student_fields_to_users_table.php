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
            // Student Details
            $table->string('roll_no')->nullable()->after('admission_no');
            $table->string('last_name')->nullable()->after('name');
            $table->date('dob')->nullable()->after('last_name');
            $table->string('gender')->nullable()->after('dob');
            $table->string('category')->nullable()->after('gender');
            $table->string('religion')->nullable()->after('category');
            $table->string('caste')->nullable()->after('religion');
            $table->date('admission_date')->nullable()->after('admission_no');
            $table->string('blood_group')->nullable()->after('caste');
            $table->string('house')->nullable()->after('blood_group');
            $table->string('height')->nullable()->after('house');
            $table->string('weight')->nullable()->after('height');
            $table->date('measurement_date')->nullable()->after('weight');
            $table->text('medical_history')->nullable()->after('measurement_date');

            // Parent / Guardian Details
            $table->string('father_phone')->nullable()->after('father_name');
            $table->string('father_occupation')->nullable()->after('father_phone');
            $table->string('father_photo')->nullable()->after('father_occupation');
            $table->string('mother_name')->nullable()->after('father_photo');
            $table->string('mother_phone')->nullable()->after('mother_name');
            $table->string('mother_occupation')->nullable()->after('mother_phone');
            $table->string('mother_photo')->nullable()->after('mother_occupation');
            $table->string('guardian_relation')->nullable()->after('guardian_name');
            $table->string('guardian_email')->nullable()->after('guardian_relation');
            $table->string('guardian_photo')->nullable()->after('guardian_email');
            $table->string('guardian_occupation')->nullable()->after('guardian_photo');
            $table->text('guardian_address')->nullable()->after('guardian_occupation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'roll_no',
                'last_name',
                'dob',
                'gender',
                'category',
                'religion',
                'caste',
                'admission_date',
                'blood_group',
                'house',
                'height',
                'weight',
                'measurement_date',
                'medical_history',
                'father_phone',
                'father_occupation',
                'father_photo',
                'mother_name',
                'mother_phone',
                'mother_occupation',
                'mother_photo',
                'guardian_relation',
                'guardian_email',
                'guardian_photo',
                'guardian_occupation',
                'guardian_address'
            ]);
        });
    }
};
