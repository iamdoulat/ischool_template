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
        // Delete any currencies not in the allowed list
        Currency::whereNotIn('short_code', ['USD', 'BDT', 'INR', 'AED'])->delete();

        $currencies = [
            ['currency' => 'United States Dollar', 'short_code' => 'USD', 'symbol' => '$', 'rate' => 1.0000, 'is_base' => true, 'is_active' => true, 'is_enabled' => true],
            ['currency' => 'Bangladeshi Taka', 'short_code' => 'BDT', 'symbol' => '৳', 'rate' => 110.0000, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'Indian Rupee', 'short_code' => 'INR', 'symbol' => '₹', 'rate' => 83.0000, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
            ['currency' => 'United Arab Emirates Dirham', 'short_code' => 'AED', 'symbol' => 'AED', 'rate' => 3.6700, 'is_base' => false, 'is_active' => false, 'is_enabled' => true],
        ];

        foreach ($currencies as $currencyData) {
            Currency::updateOrCreate(
                ['short_code' => $currencyData['short_code']],
                $currencyData
            );
        }

        Currency::where('short_code', 'USD')->update(['is_base' => true]);
        Currency::where('short_code', '!=', 'USD')->update(['is_base' => false]);
    }
}
