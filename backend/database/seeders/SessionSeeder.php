<?php

namespace Database\Seeders;

use App\Models\AcademicSession;
use Illuminate\Database\Seeder;

class SessionSeeder extends Seeder
{
    public function run(): void
    {
        $sessions = [
            ['session' => '2023-24', 'is_active' => false],
            ['session' => '2024-25', 'is_active' => true],
            ['session' => '2025-26', 'is_active' => false],
        ];

        foreach ($sessions as $data) {
            AcademicSession::updateOrCreate(
                ['session' => $data['session']],
                $data
            );
        }
    }
}
