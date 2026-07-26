<?php

namespace Tests\Feature;

use App\Models\PaymentGatewaySetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentGatewaySettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function it_can_get_all_payment_gateway_settings()
    {
        PaymentGatewaySetting::create([
            'provider' => 'offline',
            'config' => ['name' => 'Offline Payment'],
            'status' => true,
        ]);

        PaymentGatewaySetting::create([
            'provider' => 'paypal',
            'config' => ['username' => 'test'],
            'status' => false,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/payment-settings');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function it_can_get_specific_payment_gateway_setting()
    {
        PaymentGatewaySetting::create([
            'provider' => 'stripe',
            'config' => ['publishable_key' => 'pk_test_123'],
            'status' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/payment-settings/stripe');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'provider' => 'stripe',
                    'status' => true,
                ]
            ]);
    }

    /** @test */
    public function it_returns_default_when_provider_not_found()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/payment-settings/nonexistent');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'provider' => 'nonexistent',
                    'config' => [],
                    'status' => false
                ]
            ]);
    }

    /** @test */
    public function it_can_store_payment_gateway_setting()
    {
        $data = [
            'provider' => 'razorpay',
            'config' => [
                'key_id' => 'rzp_test_123',
                'key_secret' => 'secret_123',
            ],
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Payment gateway settings saved successfully',
            ]);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'provider' => 'razorpay',
            'status' => true,
        ]);
    }

    /** @test */
    public function it_can_update_existing_payment_gateway_setting()
    {
        PaymentGatewaySetting::create([
            'provider' => 'paypal',
            'config' => ['username' => 'old'],
            'status' => false,
        ]);

        $data = [
            'provider' => 'paypal',
            'config' => ['username' => 'new'],
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'provider' => 'paypal',
            'status' => true,
        ]);

        $this->assertEquals(1, PaymentGatewaySetting::where('provider', 'paypal')->count());
    }

    /** @test */
    public function it_requires_provider_field()
    {
        $data = [
            'config' => ['test' => 'value'],
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['provider']);
    }

    /** @test */
    public function it_requires_status_field()
    {
        $data = [
            'provider' => 'test',
            'config' => [],
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function status_must_be_boolean()
    {
        $data = [
            'provider' => 'test',
            'config' => [],
            'status' => 'not-boolean',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function config_must_be_array()
    {
        $data = [
            'provider' => 'test',
            'config' => 'not-an-array',
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['config']);
    }

    /** @test */
    public function config_is_optional()
    {
        $data = [
            'provider' => 'test',
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'provider' => 'test',
        ]);
    }

    /** @test */
    public function it_can_delete_payment_gateway_setting()
    {
        PaymentGatewaySetting::create([
            'provider' => 'paystack',
            'config' => ['public_key' => 'pk_123'],
            'status' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/system-setting/payment-settings/paystack');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Payment gateway setting deleted successfully',
            ]);

        $this->assertDatabaseMissing('payment_gateway_settings', [
            'provider' => 'paystack',
        ]);
    }

    /** @test */
    public function it_returns_404_when_deleting_non_existent_setting()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/system-setting/payment-settings/nonexistent');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Setting not found',
            ]);
    }

    /** @test */
    public function it_can_toggle_payment_gateway_status()
    {
        $setting = PaymentGatewaySetting::create([
            'provider' => 'stripe',
            'config' => ['key' => 'value'],
            'status' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings/stripe/toggle');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Status updated successfully',
            ]);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'provider' => 'stripe',
            'status' => false,
        ]);
    }

    /** @test */
    public function it_can_store_offline_payment_method()
    {
        $data = [
            'provider' => 'offline',
            'config' => [
                'name' => 'Offline Payment',
                'description' => 'Pay by cash or bank transfer',
                'instructions' => 'Please visit the school office',
            ],
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'provider' => 'offline',
            'status' => true,
        ]);

        $setting = PaymentGatewaySetting::where('provider', 'offline')->first();
        $this->assertEquals('Offline Payment', $setting->config['name']);
    }

    /** @test */
    public function it_can_store_active_gateway_selection()
    {
        $data = [
            'provider' => 'active_gateway',
            'config' => ['selected' => 'Offline'],
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'provider' => 'active_gateway',
        ]);

        $setting = PaymentGatewaySetting::where('provider', 'active_gateway')->first();
        $this->assertEquals('Offline', $setting->config['selected']);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->getJson('/api/v1/system-setting/payment-settings');
        $response->assertStatus(401);

        $response = $this->postJson('/api/v1/system-setting/payment-settings', [
            'provider' => 'test',
            'status' => true,
        ]);
        $response->assertStatus(401);

        $response = $this->deleteJson('/api/v1/system-setting/payment-settings/test');
        $response->assertStatus(401);

        $response = $this->postJson('/api/v1/system-setting/payment-settings/test/toggle');
        $response->assertStatus(401);
    }

    /** @test */
    public function provider_must_not_exceed_255_characters()
    {
        $data = [
            'provider' => str_repeat('a', 256),
            'status' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/payment-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['provider']);
    }
}
