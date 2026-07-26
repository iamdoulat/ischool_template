<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentUserSeeder extends Seeder
{
    /**
     * Seed a Student login user.
     *
     * Login accepts email / username / admission_no, so STD-0100 works
     * as the username because it is set as both username and admission_no.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['admission_no' => 'STD-0100'],
            [
                'name'            => 'Test Student',
                'email'           => 'std-0100@ischool.com',
                'username'        => 'STD-0100',
                'password'        => Hash::make('student123'),
                'role'            => 'Student',
                'active'          => true,
                'school_class_id' => 1,
                'section_id'      => 1,
            ]
        );
    }
}
