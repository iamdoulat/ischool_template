<?php

namespace Database\Seeders;

use App\Models\OnlineAdmissionField;
use App\Models\OnlineAdmissionSetting;
use Illuminate\Database\Seeder;

class OnlineAdmissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Initial Settings
        OnlineAdmissionSetting::firstOrCreate([
            'id' => 1
        ], [
            'online_admission' => true,
            'online_admission_payment_option' => true,
            'online_admission_form_fees' => 100.00,
            'instructions' => 'General Instruction:- These instructions pertain to online application for admission to Smart School. All applicants are advised to read and understand the following before proceeding.',
            'terms_conditions' => 'General Terms & Conditions for Students:- 1. The User declares that the content of the Portal shall be accessed for his/her personal and non-commercial use only and no other use is permitted.',
        ]);

        // Default Fields - mirrors all fields from student-admission form
        $fields = [
            // Student Info
            ['name' => 'Last Name', 'field_name' => 'last_name'],
            ['name' => 'Middle Name', 'field_name' => 'middle_name'],
            ['name' => 'Category', 'field_name' => 'category'],
            ['name' => 'Religion', 'field_name' => 'religion'],
            ['name' => 'Caste', 'field_name' => 'caste'],
            ['name' => 'Mobile Number', 'field_name' => 'mobile_number'],
            ['name' => 'Email', 'field_name' => 'email'],
            ['name' => 'Student Photo', 'field_name' => 'student_photo'],
            ['name' => 'House', 'field_name' => 'house'],
            ['name' => 'Blood Group', 'field_name' => 'blood_group'],
            ['name' => 'Height', 'field_name' => 'height'],
            ['name' => 'Weight', 'field_name' => 'weight'],
            ['name' => 'Measurement Date', 'field_name' => 'measurement_date'],
            // Extended Student Info
            ['name' => 'National ID / Birth Cert', 'field_name' => 'national_identification_no'],
            ['name' => 'Place of Birth', 'field_name' => 'birth_place'],
            ['name' => 'State', 'field_name' => 'state'],
            ['name' => 'Nationality', 'field_name' => 'nationality'],
            ['name' => 'Mother Tongue', 'field_name' => 'mother_tongue'],
            ['name' => 'Second Language', 'field_name' => 'second_language'],
            ['name' => 'Identification Marks', 'field_name' => 'identification_marks'],
            ['name' => 'Medical History', 'field_name' => 'medical_history'],
            ['name' => 'Appraisal Achievements', 'field_name' => 'appraisal_achievements'],
            ['name' => 'General Behaviour', 'field_name' => 'general_behaviour'],
            ['name' => 'RTE', 'field_name' => 'rte'],
            // Address
            ['name' => 'Current Address', 'field_name' => 'current_address'],
            ['name' => 'Permanent Address', 'field_name' => 'permanent_address'],
            ['name' => 'Postal Code', 'field_name' => 'postal_code'],
            // Bank Info
            ['name' => 'Bank Account No', 'field_name' => 'bank_account_no'],
            ['name' => 'Bank Name', 'field_name' => 'bank_name'],
            ['name' => 'IFSC Code', 'field_name' => 'ifsc_code'],
            // Previous School
            ['name' => 'Previous School Details', 'field_name' => 'previous_school_details'],
            ['name' => 'Previous Academic Record', 'field_name' => 'previous_academic_record'],
            ['name' => 'Note', 'field_name' => 'note'],
            // Parents
            ['name' => 'Father Name', 'field_name' => 'father_name'],
            ['name' => 'Father Phone', 'field_name' => 'father_phone'],
            ['name' => 'Father Occupation', 'field_name' => 'father_occupation'],
            ['name' => 'Father Photo', 'field_name' => 'father_photo'],
            ['name' => 'Mother Name', 'field_name' => 'mother_name'],
            ['name' => 'Mother Phone', 'field_name' => 'mother_phone'],
            ['name' => 'Mother Occupation', 'field_name' => 'mother_occupation'],
            ['name' => 'Mother Photo', 'field_name' => 'mother_photo'],
            // Guardian
            ['name' => 'If Guardian Is', 'field_name' => 'if_guardian_is'],
            ['name' => 'Guardian Name', 'field_name' => 'guardian_name'],
            ['name' => 'Guardian Relation', 'field_name' => 'guardian_relation'],
            ['name' => 'Guardian Phone', 'field_name' => 'guardian_phone'],
            ['name' => 'Guardian Email', 'field_name' => 'guardian_email'],
            ['name' => 'Guardian Address', 'field_name' => 'guardian_address'],
            ['name' => 'Guardian Photo', 'field_name' => 'guardian_photo'],
        ];


        foreach ($fields as $field) {
            OnlineAdmissionField::firstOrCreate([
                'field_name' => $field['field_name']
            ], [
                'name' => $field['name'],
                'is_active' => true,
            ]);
        }
    }
}
