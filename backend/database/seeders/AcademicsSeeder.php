<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Database\Seeder;

class AcademicsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
        $sections = ['A', 'B', 'C', 'D'];

        foreach ($classes as $className) {
            $class = SchoolClass::create(['name' => $className]);

            foreach ($sections as $sectionName) {
                Section::create([
                    'name' => $sectionName,
                    'school_class_id' => $class->id,
                ]);
            }
        }
    }
}
