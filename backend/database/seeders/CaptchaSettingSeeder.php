<?php

namespace Database\Seeders;

use App\Models\CaptchaSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CaptchaSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            'user_login' => 'User login',
            'login' => 'Login',
            'admission' => 'Admission',
            'complain' => 'Complain',
            'contact_us' => 'Contact Us',
            'guest_login_signup' => 'Guest login and signup',
        ];

        foreach ($settings as $alias => $name) {
            CaptchaSetting::firstOrCreate(
                ['alias' => $alias],
                ['name' => $name, 'is_active' => false]
            );
        }
    }
}
