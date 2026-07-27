<?php

namespace App\Services;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\GeneralSetting;
use ZipArchive;

class SystemUpdateService
{
    /**
     * Get the current system version.
     */
    public function getCurrentVersion(): string
    {
        $envVersion = env('SYSTEM_VERSION');
        if (!empty($envVersion)) {
            return $envVersion;
        }

        $configVersion = config('app.version');
        if (!empty($configVersion)) {
            return $configVersion;
        }

        try {
            $setting = GeneralSetting::first();
            if ($setting && !empty($setting->app_version)) {
                return $setting->app_version;
            }
        } catch (\Throwable $e) {
            // Database might not be ready or column missing
        }

        return '1.0.0';
    }

    /**
     * Update the SYSTEM_VERSION in backend .env file and GeneralSetting model.
     */
    public function updateEnvVersion(string $newVersion): bool
    {
        try {
            $envPath = base_path('.env');
            if (File::exists($envPath)) {
                $envContent = File::get($envPath);

                if (preg_match('/^SYSTEM_VERSION=.*$/m', $envContent)) {
                    $envContent = preg_replace('/^SYSTEM_VERSION=.*$/m', 'SYSTEM_VERSION=' . $newVersion, $envContent);
                } else {
                    $envContent .= "\nSYSTEM_VERSION=" . $newVersion . "\n";
                }

                File::put($envPath, $envContent);
            }

            // Sync with GeneralSetting table if exists
            try {
                $setting = GeneralSetting::first();
                if ($setting) {
                    $setting->app_version = $newVersion;
                    $setting->save();
                }
            } catch (\Throwable $e) {
                Log::warning('Could not update GeneralSetting app_version: ' . $e->getMessage());
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to update .env version: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check for available updates from a remote URL or GitHub Releases.
     */
    public function checkRemoteUpdate(?string $updateUrl = null): array
    {
        $currentVersion = $this->getCurrentVersion();
        $targetUrl = $updateUrl ?? env('UPDATE_SERVER_URL', 'https://api.github.com/repos/ischool/ischool-backend/releases/latest');

        try {
            if (empty($targetUrl) || filter_var($targetUrl, FILTER_VALIDATE_URL) === false) {
                return [
                    'has_update' => false,
                    'current_version' => $currentVersion,
                    'latest_version' => $currentVersion,
                    'message' => 'No valid update server configured.',
                    'download_url' => null,
                    'changelog' => null
                ];
            }

            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'iSchool-Updater'
            ])->get($targetUrl);

            if ($response->successful()) {
                $data = $response->json();
                $latestVersion = ltrim($data['tag_name'] ?? $data['version'] ?? $currentVersion, 'v');
                $downloadUrl = $data['zipball_url'] ?? $data['assets'][0]['browser_download_url'] ?? $data['download_url'] ?? null;
                $changelog = $data['body'] ?? $data['changelog'] ?? 'Bug fixes and performance updates.';

                $hasUpdate = version_compare($latestVersion, $currentVersion, '>');

                return [
                    'has_update' => $hasUpdate,
                    'current_version' => $currentVersion,
                    'latest_version' => $latestVersion,
                    'download_url' => $downloadUrl,
                    'changelog' => $changelog,
                    'published_at' => $data['published_at'] ?? date('Y-m-d'),
                    'message' => $hasUpdate ? 'New update available!' : 'You are running the latest version.'
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Remote update check failed: ' . $e->getMessage());
        }

        return [
            'has_update' => false,
            'current_version' => $currentVersion,
            'latest_version' => $currentVersion,
            'message' => 'You are using the latest version.',
            'download_url' => null,
            'changelog' => null
        ];
    }

    /**
     * Download an update ZIP from remote URL and apply it.
     */
    public function downloadAndInstallRemote(string $downloadUrl): array
    {
        $tempDir = storage_path('app/updates');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $zipPath = $tempDir . '/remote_update_' . time() . '.zip';

        try {
            $response = Http::timeout(120)->withHeaders([
                'User-Agent' => 'iSchool-Updater'
            ])->get($downloadUrl);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => 'Failed to download update file from remote server.'
                ];
            }

            File::put($zipPath, $response->body());

            $result = $this->processZipUpdate($zipPath);

            // Clean up downloaded zip
            File::delete($zipPath);

            return $result;
        } catch (\Throwable $e) {
            if (File::exists($zipPath)) {
                File::delete($zipPath);
            }
            return [
                'success' => false,
                'message' => 'Error during remote update download: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process and extract a uploaded ZIP update archive.
     */
    public function processZipUpdate(string $zipPath): array
    {
        if (!File::exists($zipPath)) {
            return [
                'success' => false,
                'message' => 'Update ZIP file does not exist.'
            ];
        }

        if (!class_exists('ZipArchive')) {
            return [
                'success' => false,
                'message' => 'PHP ZipArchive extension is not enabled on the server.'
            ];
        }

        $extractPath = storage_path('app/updates/extract_' . time());
        File::makeDirectory($extractPath, 0755, true);

        $zip = new ZipArchive();
        $res = $zip->open($zipPath);

        if ($res !== true) {
            File::deleteDirectory($extractPath);
            return [
                'success' => false,
                'message' => 'Failed to open ZIP archive. Code: ' . $res
            ];
        }

        $zip->extractTo($extractPath);
        $zip->close();

        // Check structure of extracted directory (support root, update/, or single nested folder)
        $workPath = $extractPath;
        $subDirs = File::directories($extractPath);
        $subFiles = File::files($extractPath);

        // If zip contains a single top folder (e.g., 'update' or repo folder)
        if (count($subDirs) === 1 && count($subFiles) === 0) {
            $workPath = $subDirs[0];
        } elseif (File::exists($extractPath . '/update')) {
            $workPath = $extractPath . '/update';
        }

        // Parse manifest or version.json if present
        $newVersion = null;
        $manifestPath = $workPath . '/version.json';
        if (!File::exists($manifestPath)) {
            $manifestPath = $workPath . '/manifest.json';
        }

        if (File::exists($manifestPath)) {
            $manifest = json_decode(File::get($manifestPath), true);
            $newVersion = $manifest['version'] ?? null;
        }

        $logs = [];
        $targetBasePath = base_path();
        $filesUpdated = 0;
        $updatedFiles = [];

        // Auto-clean any legacy backslash-filename artifacts or update_package folder in root base path
        try {
            $legacyRootDir = base_path('update_package');
            if (File::exists($legacyRootDir)) {
                File::deleteDirectory($legacyRootDir);
                $logs[] = "Cleaned up legacy root update_package directory.";
            }

            $rootFiles = File::files($targetBasePath);
            foreach ($rootFiles as $rf) {
                $rfName = $rf->getFilename();
                if (str_contains($rfName, '\\') || str_contains($rfName, '%5C')) {
                    File::delete($rf->getPathname());
                    $logs[] = "Cleaned up stray root artifact: " . $rfName;
                }
            }
        } catch (\Throwable $e) {
            // Ignore cleanup warnings
        }

        $sourceFiles = File::allFiles($workPath);
        foreach ($sourceFiles as $file) {
            $relativePath = str_replace('\\', '/', $file->getRelativePathname());

            // Skip meta files that shouldn't be overwritten directly into backend
            if (in_array(basename($relativePath), ['version.json', 'manifest.json', 'update.php', 'script.php'])) {
                continue;
            }

            // Strip leading 'backend/' if present in path inside zip
            $normalizedRelative = preg_replace('#^backend[/\\\\]#i', '', $relativePath);
            $normalizedRelative = str_replace('\\', '/', $normalizedRelative);

            // Prevent overwriting sensitive configuration & runtime files
            if (preg_match('#^(\.env|\.git|storage/|node_modules/|vendor/)#i', $normalizedRelative)) {
                continue;
            }

            $destinationFile = $targetBasePath . '/' . ltrim($normalizedRelative, '/');
            $destinationDir = dirname($destinationFile);

            if (!File::exists($destinationDir)) {
                File::makeDirectory($destinationDir, 0755, true);
            }

            File::copy($file->getPathname(), $destinationFile);
            $filesUpdated++;

            $standaloneName = basename($normalizedRelative);
            $updatedFiles[] = [
                'name' => $standaloneName,
                'path' => $normalizedRelative,
                'extension' => $file->getExtension(),
                'size' => $file->getSize(),
            ];

            $logs[] = "Updated file: " . $standaloneName . " [" . $normalizedRelative . "]";
        }

        // Run custom PHP update script if present
        $customScriptPath = $workPath . '/update.php';
        if (!File::exists($customScriptPath)) {
            $customScriptPath = $workPath . '/scripts/update.php';
        }

        if (File::exists($customScriptPath)) {
            try {
                include_once $customScriptPath;
                $logs[] = "Executed custom update script successfully.";
            } catch (\Throwable $e) {
                Log::error("Custom update script execution error: " . $e->getMessage());
                $logs[] = "Warning: Custom update script threw exception: " . $e->getMessage();
            }
        }

        // Execute Database Migrations
        $migrationsRun = [];
        try {
            Artisan::call('migrate', ['--force' => true]);
            $migrationOutput = Artisan::output();
            
            if (!empty($migrationOutput)) {
                preg_match_all('/(?:Running|Migrating|Migrated):\s*([0-9_a-zA-Z]+)/i', $migrationOutput, $matches);
                if (!empty($matches[1])) {
                    $migrationsRun = array_values(array_unique($matches[1]));
                }
            }

            $logs[] = "Database migrations executed: " . (count($migrationsRun) > 0 ? implode(', ', $migrationsRun) : 'Schema is up to date.');
        } catch (\Throwable $e) {
            Log::error("Migration failed during system update: " . $e->getMessage());
            $logs[] = "Migration Error: " . $e->getMessage();
        }

        // Update Version in .env
        if (empty($newVersion)) {
            // Auto increment minor version if version.json wasn't provided
            $current = $this->getCurrentVersion();
            $parts = explode('.', $current);
            if (count($parts) === 3) {
                $parts[2] = (int)$parts[2] + 1;
                $newVersion = implode('.', $parts);
            } else {
                $newVersion = $current;
            }
        }

        $this->updateEnvVersion($newVersion);
        $logs[] = "Updated SYSTEM_VERSION to " . $newVersion;

        // Clear Caches
        try {
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('route:clear');
            $logs[] = "System caches cleared.";
        } catch (\Throwable $e) {
            Log::warning("Cache clear warning: " . $e->getMessage());
        }

        // Clean up temporary extracted folder
        File::deleteDirectory($extractPath);

        return [
            'success' => true,
            'version' => $newVersion,
            'files_updated' => $filesUpdated,
            'updated_files' => $updatedFiles,
            'migrations_run' => $migrationsRun,
            'message' => 'System successfully updated to version ' . $newVersion,
            'logs' => $logs
        ];
    }
}
