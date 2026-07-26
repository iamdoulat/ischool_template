<?php

namespace Database\Seeders;

use App\Models\SidebarMenu;
use Illuminate\Database\Seeder;

class SidebarMenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $menus = [
            ['name' => 'dashboard', 'label' => 'Dashboard'],
            ['name' => 'front_office', 'label' => 'Front Office'],
            ['name' => 'student_information', 'label' => 'Student Information'],
            ['name' => 'fees_collection', 'label' => 'Fees Collection'],
            ['name' => 'income', 'label' => 'Income'],
            ['name' => 'expenses', 'label' => 'Expenses'],
            ['name' => 'attendance', 'label' => 'Attendance'],
            ['name' => 'examinations', 'label' => 'Examinations'],
            ['name' => 'cbse_examination', 'label' => 'CBSE Examination'],
            ['name' => 'online_examinations', 'label' => 'Online Examinations'],
            ['name' => 'academics', 'label' => 'Academics'],
            ['name' => 'human_resource', 'label' => 'Human Resource'],
            ['name' => 'communicate', 'label' => 'Communicate'],
            ['name' => 'download_center', 'label' => 'Download Center'],
            ['name' => 'homework', 'label' => 'Homework'],
            ['name' => 'online_course', 'label' => 'Online Course'],
            ['name' => 'library', 'label' => 'Library'],
            ['name' => 'inventory', 'label' => 'Inventory'],
            ['name' => 'transport', 'label' => 'Transport'],
            ['name' => 'hostel', 'label' => 'Hostel'],
            ['name' => 'certificate', 'label' => 'Certificate'],
            ['name' => 'multi_branch', 'label' => 'Multi Branch'],
            ['name' => 'behaviour_records', 'label' => 'Behaviour Records'],
            ['name' => 'front_cms', 'label' => 'Front CMS'],
            ['name' => 'alumni', 'label' => 'Alumni'],
            ['name' => 'reports', 'label' => 'Reports'],
            ['name' => 'gmeet_live_classes', 'label' => 'Gmeet Live Classes'],
            ['name' => 'zoom_live_classes', 'label' => 'Zoom Live Classes'],
            ['name' => 'lesson_plan', 'label' => 'Lesson Plan'],
            ['name' => 'student_cv', 'label' => 'Student CV'],
            ['name' => 'annual_calendar', 'label' => 'Annual Calendar'],
            ['name' => 'qr_code_attendance', 'label' => 'QR Code Attendance'],
            ['name' => 'system_setting', 'label' => 'System Settings', 'submenu_order' => [
                'general_setting', 'session_setting', 'notification_setting',
                'whatsapp_messaging', 'sms_setting', 'email_setting',
                'payment_methods', 'print_header_footer', 'thermal_print',
                'front_cms_setting', 'backup_restore', 'currency', 'users',
                'roles_permissions', 'languages', 'addons',
                'custom_fields', 'captcha_setting', 'system_fields',
                'student_profile_setting', 'online_admission', 'admission_form', 'file_types',
                'sidebar_menu', 'system_update',
            ]],

            // Additional/Available items mentioned in mock
            ['name' => 'quick_fees', 'label' => 'Quick Fees'],
            ['name' => 'thermal_print', 'label' => 'Thermal Print'],
            ['name' => 'whatsapp_messaging', 'label' => 'Whatsapp Messaging'],
        ];

        foreach ($menus as $index => $menu) {
            SidebarMenu::updateOrCreate([
                'name' => $menu['name']
            ], [
                'label' => $menu['label'],
                'is_visible' => true,
                'sort_order' => $index,
                'submenu_order' => $menu['submenu_order'] ?? null,
            ]);
        }

    }
}
