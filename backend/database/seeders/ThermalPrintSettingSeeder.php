<?php

namespace Database\Seeders;

use App\Models\ThermalPrintSetting;
use Illuminate\Database\Seeder;

class ThermalPrintSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ThermalPrintSetting::updateOrCreate(
            ['id' => 1],
            [
                'status' => true,
                'school_name' => 'Smart School Management System',
                'address' => '25 Kings Street, California<br>Phone: +1 (555) 123-4567<br>Email: info@smartschool.com',
                'footer_text' => 'This is a computer-generated receipt. No signature required.',
            ]
        );
    }
}
