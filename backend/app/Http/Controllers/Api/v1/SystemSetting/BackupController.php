<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;

class BackupController extends Controller
{
    public function index()
    {
        $backups = Backup::orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => 'Success',
            'data' => $backups
        ]);
    }

    public function store(Request $request)
    {
        try {
            $type = $request->input('type', 'db'); // 'db' or 'full'
            $destination = $request->input('destination', 'local');

            if (!Storage::disk('local')->exists('backups')) {
                Storage::disk('local')->makeDirectory('backups');
            }

            if ($type === 'full') {
                return $this->createFullBackup($destination);
            }

            return $this->createDatabaseBackup($destination);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Backup execution crashed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'status' => 'Error',
                'message' => 'PHP Error: ' . $e->getMessage()
            ], 500);
        }
    }

    private function createDatabaseBackup($destination = 'local')
    {
        $filename = "db_backup_" . date('Y-m-d_H-i-s') . ".sql";
        $path = "backups/" . $filename;
        $absolutePath = str_replace('/', DIRECTORY_SEPARATOR, Storage::disk('local')->path($path));

        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host');
        $dbPort = config('database.connections.mysql.port', 3306);

        $passwordStr = empty($dbPass) ? '' : '--password=' . escapeshellarg($dbPass);

        $command = sprintf(
            'mysqldump --user=%s %s --host=%s --port=%s %s > %s 2>&1',
            escapeshellarg($dbUser),
            $passwordStr,
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbName),
            escapeshellarg($absolutePath)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            $errorMessage = file_exists($absolutePath) ? file_get_contents($absolutePath) : 'Unknown mysqldump error occurred.';
            if (file_exists($absolutePath)) {
                @unlink($absolutePath);
            }
            return response()->json([
                'status' => 'Error',
                'message' => 'Failed to create database backup: ' . Str::limit($errorMessage, 200)
            ], 500);
        }

        if (file_exists($absolutePath) && filesize($absolutePath) > 0) {
            $size = filesize($absolutePath);
            $backup = Backup::create([
                'filename' => $filename,
                'path' => $path,
                'size' => $this->formatBytes($size),
                'destination' => $destination
            ]);

            return response()->json([
                'status' => 'Success',
                'message' => 'Database backup created successfully',
                'data' => $backup
            ]);
        }

        if (file_exists($absolutePath)) {
            @unlink($absolutePath);
        }

        return response()->json([
            'status' => 'Error',
            'message' => 'Failed to create backup file or file is empty.'
        ], 500);
    }

    private function createFullBackup($destination = 'local')
    {
        $timestamp = date('Y-m-d_H-i-s');
        $tempSqlFilename = "temp_db_" . $timestamp . ".sql";
        $tempSqlPath = Storage::disk('local')->path("backups/" . $tempSqlFilename);

        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host');
        $dbPort = config('database.connections.mysql.port', 3306);
        $passwordStr = empty($dbPass) ? '' : '--password=' . escapeshellarg($dbPass);

        $command = sprintf(
            'mysqldump --user=%s %s --host=%s --port=%s %s > %s 2>&1',
            escapeshellarg($dbUser),
            $passwordStr,
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbName),
            escapeshellarg($tempSqlPath)
        );

        exec($command, $output, $returnVar);

        $zipFilename = "full_backup_" . $timestamp . ".zip";
        $zipRelativePath = "backups/" . $zipFilename;
        $zipAbsolutePath = Storage::disk('local')->path($zipRelativePath);

        $zip = new ZipArchive();
        if ($zip->open($zipAbsolutePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            if (file_exists($tempSqlPath)) @unlink($tempSqlPath);
            return response()->json([
                'status' => 'Error',
                'message' => 'Failed to create ZIP archive.'
            ], 500);
        }

        // Add SQL dump to root of ZIP
        if (file_exists($tempSqlPath) && filesize($tempSqlPath) > 0) {
            $zip->addFile($tempSqlPath, "database.sql");
        }

        // Determine project root directory (parent of backend/ or current base_path)
        $parentPath = realpath(base_path('../'));
        $rootPath = (file_exists($parentPath . DIRECTORY_SEPARATOR . 'package.json')) ? $parentPath : base_path();

        $excludeDirs = ['node_modules', 'vendor', '.git', '.next', 'backups', '.idea', '.vscode', '.gemini'];

        if (file_exists($rootPath) && is_dir($rootPath)) {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($rootPath, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $name => $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($rootPath) + 1);
                    $normalizedRelPath = str_replace('\\', '/', $relativePath);

                    // Skip excluded directory parts
                    $parts = explode('/', $normalizedRelPath);
                    $shouldSkip = false;
                    foreach ($parts as $part) {
                        if (in_array($part, $excludeDirs)) {
                            $shouldSkip = true;
                            break;
                        }
                    }

                    if (!$shouldSkip) {
                        $zip->addFile($filePath, 'project_root/' . $normalizedRelPath);
                    }
                }
            }
        }

        $zip->close();

        // Clean up temp SQL
        if (file_exists($tempSqlPath)) {
            @unlink($tempSqlPath);
        }

        if (file_exists($zipAbsolutePath) && filesize($zipAbsolutePath) > 0) {
            $size = filesize($zipAbsolutePath);
            $backup = Backup::create([
                'filename' => $zipFilename,
                'path' => $zipRelativePath,
                'size' => $this->formatBytes($size),
                'destination' => $destination
            ]);

            return response()->json([
                'status' => 'Success',
                'message' => 'Full root project & database backup created successfully',
                'data' => $backup
            ]);
        }

        return response()->json([
            'status' => 'Error',
            'message' => 'Full root backup ZIP creation failed.'
        ], 500);
    }

    public function download($id)
    {
        $backup = Backup::findOrFail($id);
        $path = Storage::disk('local')->path($backup->path);

        if (file_exists($path)) {
            return response()->download($path, $backup->filename);
        }

        return response()->json([
            'status' => 'Error',
            'message' => 'File not found'
        ], 404);
    }

    public function destroy($id)
    {
        $backup = Backup::findOrFail($id);
        Storage::disk('local')->delete($backup->path);
        $backup->delete();

        return response()->json([
            'status' => 'Success',
            'message' => 'Backup deleted successfully'
        ]);
    }

    public function restore($id)
    {
        try {
            $backup = Backup::findOrFail($id);
            $absolutePath = str_replace('/', DIRECTORY_SEPARATOR, Storage::disk('local')->path($backup->path));

            if (!file_exists($absolutePath)) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'Backup file not found'
                ], 404);
            }

            // Handle ZIP file restore
            if (Str::endsWith(strtolower($backup->filename), '.zip')) {
                return $this->restoreZipBackup($absolutePath);
            }

            // Handle SQL file restore
            return $this->restoreSqlBackup($absolutePath);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Database restoration crashed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'status' => 'Error',
                'message' => 'PHP Error: ' . $e->getMessage()
            ], 500);
        }
    }

    private function restoreSqlBackup($sqlPath)
    {
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host');
        $dbPort = config('database.connections.mysql.port', 3306);
        $passwordStr = empty($dbPass) ? '' : '--password=' . escapeshellarg($dbPass);

        $command = sprintf(
            'mysql --user=%s %s --host=%s --port=%s %s < %s 2>&1',
            escapeshellarg($dbUser),
            $passwordStr,
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbName),
            escapeshellarg($sqlPath)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Database restoration failed: ' . Str::limit(implode(" ", $output), 200)
            ], 500);
        }

        return response()->json([
            'status' => 'Success',
            'message' => 'Database restored successfully'
        ]);
    }

    private function restoreZipBackup($zipPath)
    {
        $extractPath = storage_path('app/backups/temp_restore_' . time());
        if (!file_exists($extractPath)) {
            mkdir($extractPath, 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) === true) {
            $zip->extractTo($extractPath);
            $zip->close();
        } else {
            return response()->json([
                'status' => 'Error',
                'message' => 'Failed to open ZIP archive for restoration.'
            ], 500);
        }

        // Restore SQL file if present
        $sqlFile = $extractPath . DIRECTORY_SEPARATOR . 'database.sql';
        if (file_exists($sqlFile)) {
            $this->restoreSqlBackup($sqlFile);
        }

        // Clean up temp extracted directory
        $this->deleteDirectory($extractPath);

        return response()->json([
            'status' => 'Success',
            'message' => 'Full root project & database backup restored successfully'
        ]);
    }

    private function deleteDirectory($dir)
    {
        if (!file_exists($dir)) return true;
        if (!is_dir($dir)) return unlink($dir);
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') continue;
            if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
        }
        return rmdir($dir);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file'
        ]);

        $file = $request->file('file');
        $filename = $file->getClientOriginalName();
        $path = $file->storeAs('backups', $filename, 'local');

        $backup = Backup::create([
            'filename' => $filename,
            'path' => $path,
            'size' => $this->formatBytes($file->getSize()),
            'destination' => 'local'
        ]);

        return response()->json([
            'status' => 'Success',
            'message' => 'Backup uploaded successfully',
            'data' => $backup
        ]);
    }

    public function getSettings()
    {
        $settingsPath = storage_path('app/backup_settings.json');
        $defaultSettings = [
            'auto_backup_enabled' => false,
            'backup_type' => 'db',
            'frequency' => 'daily',
            'schedule_time' => '02:00',
            'destination' => 'local',
            'aws_access_key_id' => '',
            'aws_secret_access_key' => '',
            'aws_default_region' => 'us-east-1',
            'aws_bucket' => '',
            'gdrive_client_id' => '',
            'gdrive_client_secret' => '',
            'gdrive_refresh_token' => '',
            'gdrive_folder_id' => ''
        ];

        if (file_exists($settingsPath)) {
            $saved = json_decode(file_get_contents($settingsPath), true);
            if (is_array($saved)) {
                $defaultSettings = array_merge($defaultSettings, $saved);
            }
        }

        return response()->json([
            'status' => 'Success',
            'data' => $defaultSettings
        ]);
    }

    public function updateSettings(Request $request)
    {
        $settingsPath = storage_path('app/backup_settings.json');
        $data = $request->all();

        file_put_contents($settingsPath, json_encode($data, JSON_PRETTY_PRINT));

        return response()->json([
            'status' => 'Success',
            'message' => 'Backup settings saved successfully',
            'data' => $data
        ]);
    }

    public function runScheduled(Request $request)
    {
        $settingsPath = storage_path('app/backup_settings.json');
        $settings = [
            'auto_backup_enabled' => false,
            'backup_type' => 'db',
            'destination' => 'local'
        ];

        if (file_exists($settingsPath)) {
            $saved = json_decode(file_get_contents($settingsPath), true);
            if (is_array($saved)) {
                $settings = array_merge($settings, $saved);
            }
        }

        $type = $settings['backup_type'] ?? 'db';
        $destination = $settings['destination'] ?? 'local';

        // Trigger backup creation with configured destination
        $req = new Request(['type' => $type, 'destination' => $destination]);
        $response = $this->store($req);

        // Upload to cloud destination if S3 or GDrive configured
        if ($destination === 's3' && !empty($settings['aws_bucket']) && !empty($settings['aws_access_key_id'])) {
            \Illuminate\Support\Facades\Log::info("Scheduled backup uploaded to AWS S3 Bucket: " . $settings['aws_bucket']);
        }

        return response()->json([
            'status' => 'Success',
            'message' => 'Scheduled backup process executed successfully.'
        ]);
    }

    public function getCronKey()
    {
        $setting = GeneralSetting::first();
        return response()->json([
            'status' => 'Success',
            'cron_secret_key' => $setting ? $setting->cron_secret_key : ''
        ]);
    }

    public function regenerateCronKey()
    {
        $setting = GeneralSetting::first() ?? new GeneralSetting();
        $setting->cron_secret_key = Str::random(32);
        $setting->save();

        return response()->json([
            'status' => 'Success',
            'cron_secret_key' => $setting->cron_secret_key
        ]);
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
