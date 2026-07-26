<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            PortalPermissionSeeder::class,
            AcademicsSeeder::class,
            SidebarMenuSeeder::class,
            DashboardSettingSeeder::class,
            CurrencySeeder::class,
            NotificationSettingSeeder::class,
            OnlineAdmissionSeeder::class,
            SessionSeeder::class,
            FrontCmsSeeder::class,
            CaptchaSettingSeeder::class,
            SystemFieldSeeder::class,
            FileUploadSettingSeeder::class,
            LanguageSeeder::class,
            ThermalPrintSettingSeeder::class,
            PrintHeaderFooterSettingSeeder::class,
            PaymentGatewaySettingSeeder::class,
            PhoneCallLogSeeder::class,
        ]);

        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@ischool.com',
            'password' => bcrypt('superadmin123'),
            'role' => 'Super Admin',
            'phone' => '+1234567800',
        ]);

        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@ischool.com',
            'password' => bcrypt('admin123'),
            'role' => 'Admin',
            'phone' => '+1234567890',
        ]);

        User::factory()->create([
            'name' => 'John Staff',
            'email' => 'staff@ischool.com',
            'password' => bcrypt('password123'),
            'role' => 'Staff',
            'phone' => '+1234567891',
        ]);

        User::factory()->create([
            'name' => 'Alice Teacher',
            'email' => 'teacher@ischool.com',
            'password' => bcrypt('password123'),
            'role' => 'Teacher',
            'phone' => '+1234567892',
        ]);

        User::factory()->create([
            'name' => 'Bob Driver',
            'email' => 'driver@ischool.com',
            'password' => bcrypt('password123'),
            'role' => 'Driver',
            'phone' => '+1234567893',
        ]);

        User::factory()->create([
            'name' => 'Sarah Parent',
            'email' => 'parent@ischool.com',
            'password' => bcrypt('password123'),
            'role' => 'Parent',
            'phone' => '+1234567894',
        ]);

        User::factory()->create([
            'name' => 'Timmy Student',
            'email' => 'student@ischool.com',
            'password' => bcrypt('password123'),
            'role' => 'Student',
            'phone' => '+1234567895',
            'school_class_id' => 1,
            'section_id' => 1,
        ]);

    }
}
