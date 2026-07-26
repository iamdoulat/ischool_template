<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\SystemUpdateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class SystemUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected SystemUpdateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = new SystemUpdateService();
    }

    public function test_can_retrieve_system_version()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/system-setting/system-update');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => ['version', 'php_version', 'laravel_version', 'zip_enabled']
            ]);
    }

    public function test_can_check_remote_update()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/system-update/check');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => ['has_update', 'current_version', 'latest_version']
            ]);
    }

    public function test_can_process_zip_file_update()
    {
        if (!class_exists('ZipArchive')) {
            $this->markTestSkipped('ZipArchive extension not available.');
        }

        // Create temporary zip file
        $tempZipPath = storage_path('app/test_update.zip');
        $zip = new ZipArchive();
        if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $zip->addFromString('version.json', json_encode(['version' => '9.9.9']));
            $zip->addFromString('test_update_dummy.txt', 'Updated content');
            $zip->close();
        }

        $uploadedFile = new UploadedFile(
            $tempZipPath,
            'update.zip',
            'application/zip',
            null,
            true
        );

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/system-update/upload', [
                'update_file' => $uploadedFile
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.version', '9.9.9');

        if (file_exists($tempZipPath)) {
            unlink($tempZipPath);
        }
        if (file_exists(base_path('test_update_dummy.txt'))) {
            unlink(base_path('test_update_dummy.txt'));
        }
    }

    public function test_remote_install_route_exists()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/system-setting/system-update/install-remote', [
                'download_url' => 'invalid-url'
            ]);

        // Route must exist (status 422 for validation error, not 404)
        $response->assertStatus(422);
    }
}

