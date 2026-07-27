<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

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

    public function store()
    {
        try {
            $filename = "db_backup_" . date('Y-m-d_H-i-s') . ".sql";
            $path = "backups/" . $filename;

            if (!Storage::disk('local')->exists('backups')) {
                Storage::disk('local')->makeDirectory('backups');
            }

            $absolutePath = str_replace('/', DIRECTORY_SEPARATOR, Storage::disk('local')->path($path));

            $dbName = config('database.connections.mysql.database');
            $dbUser = config('database.connections.mysql.username');
            $dbPass = config('database.connections.mysql.password');
            $dbHost = config('database.connections.mysql.host');
            $dbPort = config('database.connections.mysql.port', 3306);

            $passwordStr = empty($dbPass) ? '' : '--password=' . escapeshellarg($dbPass);

            $command = sprintf(
                'mysqldump --user=%s %s --host=%s --port=%s --ssl=0 %s > %s 2>&1',
                escapeshellarg($dbUser),
                $passwordStr,
                escapeshellarg($dbHost),
                escapeshellarg($dbPort),
                escapeshellarg($dbName),
                escapeshellarg($absolutePath)
            );

            // Execute the command
            \Illuminate\Support\Facades\Log::info("Executing backup command: " . $command);
            exec($command, $output, $returnVar);
            \Illuminate\Support\Facades\Log::info("Backup command exit code: " . $returnVar);

            if ($returnVar !== 0) {
                $errorMessage = file_exists($absolutePath) ? file_get_contents($absolutePath) : 'Unknown mysqldump error occurred.';
                if (file_exists($absolutePath)) {
                    @unlink($absolutePath);
                }
                \Illuminate\Support\Facades\Log::error("Backup Failed: Return var $returnVar. Error: $errorMessage");
                return response()->json([
                    'status' => 'Error',
                    'message' => 'Failed to create backup: ' . \Illuminate\Support\Str::limit($errorMessage, 200)
                ], 500);
            }

            if (file_exists($absolutePath) && filesize($absolutePath) > 0) {
                $size = filesize($absolutePath);
                $backup = Backup::create([
                    'filename' => $filename,
                    'path' => $path,
                    'size' => $this->formatBytes($size)
                ]);

                return response()->json([
                    'status' => 'Success',
                    'message' => 'Backup created successfully',
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

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Backup execution crashed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'status' => 'Error',
                'message' => 'PHP Error: ' . $e->getMessage()
            ], 500);
        }
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
                escapeshellarg($absolutePath)
            );

            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'Database restoration failed: ' . \Illuminate\Support\Str::limit(implode(" ", $output), 200)
                ], 500);
            }

            return response()->json([
                'status' => 'Success',
                'message' => 'Database restored successfully'
            ]);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Database restoration crashed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'status' => 'Error',
                'message' => 'PHP Error: ' . $e->getMessage()
            ], 500);
        }
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
            'size' => $this->formatBytes($file->getSize())
        ]);

        return response()->json([
            'status' => 'Success',
            'message' => 'Backup uploaded successfully',
            'data' => $backup
        ]);
    }

    public function getCronKey()
    {
        $setting = GeneralSetting::first();
        return response()->json([
            'status' => 'Success',
            'cron_secret_key' => $setting->cron_secret_key
        ]);
    }

    public function regenerateCronKey()
    {
        $setting = GeneralSetting::first();
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
