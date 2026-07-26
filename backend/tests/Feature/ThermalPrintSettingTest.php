<?php

namespace Tests\Feature;

use App\Models\ThermalPrintSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThermalPrintSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function it_can_get_thermal_print_settings()
    {
        ThermalPrintSetting::create([
            'status' => true,
            'school_name' => 'Test School',
            'address' => 'Test Address',
            'footer_text' => 'Test Footer',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/thermal-print-settings');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'school_name' => 'Test School',
                    'address' => 'Test Address',
                    'footer_text' => 'Test Footer',
                ]
            ]);
    }

    /** @test */
    public function it_returns_null_when_no_settings_exist()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/thermal-print-settings');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /** @test */
    public function it_can_store_thermal_print_settings()
    {
        $data = [
            'status' => true,
            'school_name' => 'New School Name',
            'address' => 'New Address',
            'footer_text' => 'New Footer',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Thermal print settings saved successfully',
            ]);

        $this->assertDatabaseHas('thermal_print_settings', [
            'school_name' => 'New School Name',
            'address' => 'New Address',
            'footer_text' => 'New Footer',
        ]);
    }

    /** @test */
    public function it_can_update_existing_thermal_print_settings()
    {
        ThermalPrintSetting::create([
            'status' => true,
            'school_name' => 'Old School',
            'address' => 'Old Address',
            'footer_text' => 'Old Footer',
        ]);

        $data = [
            'status' => false,
            'school_name' => 'Updated School',
            'address' => 'Updated Address',
            'footer_text' => 'Updated Footer',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('thermal_print_settings', [
            'school_name' => 'Updated School',
            'status' => false,
        ]);

        $this->assertEquals(1, ThermalPrintSetting::count());
    }

    /** @test */
    public function it_requires_status_field()
    {
        $data = [
            'school_name' => 'Test School',
            'address' => 'Test Address',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function it_requires_school_name_field()
    {
        $data = [
            'status' => true,
            'address' => 'Test Address',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['school_name']);
    }

    /** @test */
    public function school_name_must_not_exceed_255_characters()
    {
        $data = [
            'status' => true,
            'school_name' => str_repeat('a', 256),
            'address' => 'Test Address',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['school_name']);
    }

    /** @test */
    public function address_is_optional()
    {
        $data = [
            'status' => true,
            'school_name' => 'Test School',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('thermal_print_settings', [
            'school_name' => 'Test School',
            'address' => '',
        ]);
    }

    /** @test */
    public function footer_text_is_optional()
    {
        $data = [
            'status' => true,
            'school_name' => 'Test School',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('thermal_print_settings', [
            'school_name' => 'Test School',
            'footer_text' => '',
        ]);
    }

    /** @test */
    public function it_can_reset_to_default_settings()
    {
        ThermalPrintSetting::create([
            'status' => false,
            'school_name' => 'Old School',
            'address' => 'Old Address',
            'footer_text' => 'Old Footer',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings/reset');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Settings reset to defaults',
            ]);

        $this->assertDatabaseHas('thermal_print_settings', [
            'status' => true,
            'school_name' => 'Smart School Management System',
        ]);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->getJson('/api/v1/system-setting/thermal-print-settings');
        $response->assertStatus(401);

        $response = $this->postJson('/api/v1/system-setting/thermal-print-settings', [
            'status' => true,
            'school_name' => 'Test',
        ]);
        $response->assertStatus(401);

        $response = $this->postJson('/api/v1/system-setting/thermal-print-settings/reset');
        $response->assertStatus(401);
    }

    /** @test */
    public function status_must_be_boolean()
    {
        $data = [
            'status' => 'not-a-boolean',
            'school_name' => 'Test School',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function address_must_not_exceed_1000_characters()
    {
        $data = [
            'status' => true,
            'school_name' => 'Test School',
            'address' => str_repeat('a', 1001),
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address']);
    }

    /** @test */
    public function footer_text_must_not_exceed_1000_characters()
    {
        $data = [
            'status' => true,
            'school_name' => 'Test School',
            'footer_text' => str_repeat('a', 1001),
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/thermal-print-settings', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['footer_text']);
    }
}
