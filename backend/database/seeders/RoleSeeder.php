<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'is_system' => true],
            ['name' => 'Admin', 'is_system' => true],
            ['name' => 'Teacher', 'is_system' => true],
            ['name' => 'Accountant', 'is_system' => true],
            ['name' => 'Librarian', 'is_system' => true],
            ['name' => 'Receptionist', 'is_system' => true],
            ['name' => 'Student', 'is_system' => true],
            ['name' => 'Parent', 'is_system' => true],
            ['name' => 'Driver', 'is_system' => true],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
