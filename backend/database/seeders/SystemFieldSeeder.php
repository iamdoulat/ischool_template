<?php

namespace Database\Seeders;

use App\Models\SystemField;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SystemFieldSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $studentFields = [
            'Roll Number', 'Middle Name', 'Last Name', 'Category', 'Religion',
            'Caste', 'Mobile Number', 'Email', 'Admission Date', 'Student Photo',
            'House', 'Blood Group', 'Height', 'Weight', 'Measurement Date',
            'Father Name', 'Father Phone', 'Father Occupation', 'RTE',
            'Previous School Details', 'Note', 'Upload Documents', 'Barcode',
        ];

        $staffFields = [
            'Employee ID', 'Date of Joining', 'Phone', 'Emergency Contact',
            'Marital Status', 'Father Name', 'Mother Name', 'Qualification',
            'Work Experience', 'Note', 'Pan Number', 'EPF No',
            'Basic Salary', 'Contract Type', 'Location', 'Bank Account Details',
        ];

        foreach ($studentFields as $name) {
            SystemField::firstOrCreate(
                ['alias' => Str::slug($name, '_'), 'scope' => 'student'],
                ['name' => $name, 'is_active' => true]
            );
        }

        foreach ($staffFields as $name) {
            SystemField::firstOrCreate(
                ['alias' => Str::slug($name, '_'), 'scope' => 'staff'],
                ['name' => $name, 'is_active' => true]
            );
        }
    }
}
