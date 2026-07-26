<?php

namespace Database\Seeders;

use App\Models\PaymentGatewaySetting;
use Illuminate\Database\Seeder;

class PaymentGatewaySettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $gateways = [
            [
                'provider' => 'offline',
                'config' => [
                    'name' => 'Offline Payment',
                    'description' => 'Pay by cash, cheque, or bank transfer',
                    'instructions' => 'Please pay at the school office or deposit to our bank account.',
                ],
                'status' => true,
            ],
            [
                'provider' => 'paypal',
                'config' => [
                    'username' => '',
                    'password' => '',
                    'signature' => '',
                    'fee_type' => 'none',
                    'fee_amount' => '0',
                ],
                'status' => false,
            ],
            [
                'provider' => 'stripe',
                'config' => [
                    'publishable_key' => '',
                    'secret_key' => '',
                ],
                'status' => false,
            ],
            [
                'provider' => 'razorpay',
                'config' => [
                    'key_id' => '',
                    'key_secret' => '',
                ],
                'status' => false,
            ],
            [
                'provider' => 'active_gateway',
                'config' => [
                    'selected' => 'Offline',
                ],
                'status' => true,
            ],
        ];

        foreach ($gateways as $gateway) {
            PaymentGatewaySetting::updateOrCreate(
                ['provider' => $gateway['provider']],
                [
                    'config' => $gateway['config'],
                    'status' => $gateway['status'],
                ]
            );
        }
    }
}
