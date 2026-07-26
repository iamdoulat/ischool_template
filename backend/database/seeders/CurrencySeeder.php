<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currencies = [
            ['currency' => 'United States Dollar', 'short_code' => 'USD', 'symbol' => '$', 'rate' => 1.0000, 'is_base' => true, 'is_active' => true, 'is_enabled' => true],
            ['currency' => 'Indian Rupee', 'short_code' => 'INR', 'symbol' => '₹', 'rate' => 83.0000, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'Canadian Dollar', 'short_code' => 'CAD', 'symbol' => 'C$', 'rate' => 1.3500, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'Bangladeshi Taka', 'short_code' => 'BDT', 'symbol' => '৳', 'rate' => 110.0000, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'Euro', 'short_code' => 'EUR', 'symbol' => '€', 'rate' => 0.9200, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'British Pound', 'short_code' => 'GBP', 'symbol' => '£', 'rate' => 0.7900, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'Australian Dollar', 'short_code' => 'AUD', 'symbol' => 'A$', 'rate' => 1.5200, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'Japanese Yen', 'short_code' => 'JPY', 'symbol' => '¥', 'rate' => 150.0000, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'United Arab Emirates Dirham', 'short_code' => 'AED', 'symbol' => 'AED', 'rate' => 3.6700, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
        ];

        foreach ($currencies as $currencyData) {
            Currency::updateOrCreate(
                ['short_code' => $currencyData['short_code']],
                $currencyData
            );
        }
    }
}
