<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $languages = [
            ['name' => 'English', 'short_code' => 'en', 'country_code' => 'US', 'is_rtl' => false, 'is_active' => true, 'is_enabled' => true],
            ['name' => 'Arabic', 'short_code' => 'ar', 'country_code' => 'SA', 'is_rtl' => true, 'is_active' => false, 'is_enabled' => true],
            ['name' => 'Spanish', 'short_code' => 'es', 'country_code' => 'ES', 'is_rtl' => false, 'is_active' => false, 'is_enabled' => true],
            ['name' => 'French', 'short_code' => 'fr', 'country_code' => 'FR', 'is_rtl' => false, 'is_active' => false, 'is_enabled' => true],
            ['name' => 'Hindi', 'short_code' => 'hi', 'country_code' => 'IN', 'is_rtl' => false, 'is_active' => false, 'is_enabled' => true],
            ['name' => 'Bengali', 'short_code' => 'bn', 'country_code' => 'BD', 'is_rtl' => false, 'is_active' => false, 'is_enabled' => true],
        ];

        foreach ($languages as $language) {
            Language::firstOrCreate(
                ['name' => $language['name']],
                $language
            );
        }
    }
}
