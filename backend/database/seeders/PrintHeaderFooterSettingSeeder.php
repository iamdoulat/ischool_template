<?php

namespace Database\Seeders;

use App\Models\PrintHeaderFooterSetting;
use Illuminate\Database\Seeder;

class PrintHeaderFooterSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            'Fees Receipt',
            'Payslip',
            'Online Admission Receipt',
            'Online Exam',
            'Email',
            'General Purpose',
            'Invoice',
        ];

        foreach ($types as $type) {
            PrintHeaderFooterSetting::updateOrCreate(
                ['type' => $type],
                [
                    'header_image_path' => null,
                    'footer_content' => "© " . date('Y') . " iSchool Management System. All rights reserved.\nFor support, contact: support@ischool.com | Phone: +1 (555) 123-4567",
                    'paper_size' => 'A4',
                ]
            );
        }
    }
}
