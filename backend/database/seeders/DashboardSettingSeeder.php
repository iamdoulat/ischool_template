<?php

namespace Database\Seeders;

use App\Models\DashboardSetting;
use Illuminate\Database\Seeder;

class DashboardSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $widgets = [
            ['name' => 'Welcome Student'],
            ['name' => 'Notice Board'],
            ['name' => 'Subject Progress'],
            ['name' => 'Upcoming Class'],
            ['name' => 'Homework'],
            ['name' => 'Teacher List'],
            ['name' => 'Visitor List'],
            ['name' => 'Library'],
        ];

        foreach ($widgets as $widget) {
            DashboardSetting::updateOrCreate(['name' => $widget['name']], $widget);
        }
    }
}
