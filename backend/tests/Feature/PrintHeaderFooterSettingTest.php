<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\PrintHeaderFooterSetting;

class PrintHeaderFooterSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'Super Admin']);
    }

    /** @test */
    public function it_requires_paper_size_field()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/print-settings', [
                'type' => 'Fees Receipt',
                'footer_content' => 'Test',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['paper_size']);
    }

    /** @test */
    public function paper_size_must_be_valid_value()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/print-settings', [
                'type' => 'Fees Receipt',
                'paper_size' => 'InvalidSize',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['paper_size']);
    }

    /** @test */
    public function it_accepts_valid_paper_sizes()
    {
        $validSizes = ['A4', 'A5', 'Legal'];

        foreach ($validSizes as $size) {
            $response = $this->actingAs($this->user, 'sanctum')
                ->postJson('/api/v1/system-setting/print-settings', [
                    'type' => 'Test Type ' . $size,
                    'paper_size' => $size,
                ]);

            $response->assertStatus(200);

            $this->assertDatabaseHas('print_header_footer_settings', [
                'type' => 'Test Type ' . $size,
                'paper_size' => $size,
            ]);
        }
    }

    /** @test */
    public function paper_size_is_saved_with_setting()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/print-settings', [
                'type' => 'Invoice',
                'paper_size' => 'Legal',
                'footer_content' => 'Invoice Footer',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'paper_size' => 'Legal',
                ]
            ]);
    }

    /** @test */
    public function it_returns_paper_size_when_fetching_settings()
    {
        PrintHeaderFooterSetting::create([
            'type' => 'Payslip',
            'paper_size' => 'A5',
            'footer_content' => 'Test',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/print-settings?type=Payslip');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'type' => 'Payslip',
                    'paper_size' => 'A5',
                ]
            ]);
    }
}

