<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExamType;

class ExamTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            'General Purpose (Pass/Fail)',
            'School Based Grading System',
            'College Based Grading System',
            'GPA Grading System',
            'Average Passing',
        ];

        foreach ($types as $type) {
            ExamType::firstOrCreate(['name' => $type]);
        }
    }
}
