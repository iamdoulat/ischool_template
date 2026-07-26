<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use ZipArchive;

class BuildUpdatePackage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update:build 
                            {--ver= : Specify target version e.g. 1.0.1} 
                            {--changelog= : Describe changes in this update} 
                            {--all : Include all backend files instead of only modified git files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically collects modified backend files and builds an update.zip package for deployment';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("==========================================");
        $this->info("      iSchool Update Package Builder      ");
        $this->info("==========================================");

        // Determine target version
        $currentVersion = env('SYSTEM_VERSION', '1.0.0');
        $version = $this->option('ver');

        if (!$version) {
            $parts = explode('.', $currentVersion);
            if (count($parts) === 3) {
                $parts[2] = (int)$parts[2] + 1;
                $defaultVersion = implode('.', $parts);
            } else {
                $defaultVersion = '1.0.1';
            }
            $version = $this->ask("Enter update version number", $defaultVersion);
        }

        $changelog = $this->option('changelog') ?? $this->ask("Enter changelog/description for this release", "Bug fixes and performance improvements.");

        $outputDir = base_path('update_package');
        if (File::exists($outputDir)) {
            File::deleteDirectory($outputDir);
        }
        File::makeDirectory($outputDir, 0755, true);

        // Create version.json
        $manifest = [
            'version' => $version,
            'changelog' => $changelog,
            'built_at' => date('Y-m-d H:i:s'),
            'current_base' => $currentVersion
        ];
        File::put($outputDir . '/version.json', json_encode($manifest, JSON_PRETTY_PRINT));

        $this->line("\n[1/3] Collecting files for version {$version}...");

        $filesToCopy = [];

        if ($this->option('all')) {
            $this->info("Collecting ALL backend files...");
            $dirsToInclude = ['app', 'database/migrations', 'routes', 'config'];
            foreach ($dirsToInclude as $dir) {
                $fullPath = base_path($dir);
                if (File::exists($fullPath)) {
                    $all = File::allFiles($fullPath);
                    foreach ($all as $file) {
                        $filesToCopy[] = $dir . '/' . $file->getRelativePathname();
                    }
                }
            }
        } else {
            // Check git modified / untracked files
            exec('git status --porcelain', $gitOutput, $gitStatus);
            if ($gitStatus === 0 && !empty($gitOutput)) {
                foreach ($gitOutput as $line) {
                    $status = substr($line, 0, 2);
                    $filePath = trim(substr($line, 3));

                    // Normalize path separators
                    $filePath = str_replace('\\', '/', $filePath);

                    // Skip non-backend files or sensitive files
                    if (preg_match('#^(\.env|\.git|storage/|node_modules/|vendor/)#i', $filePath)) {
                        continue;
                    }

                    // Only include backend files (app, database, routes, config, etc.)
                    if (File::exists(base_path($filePath)) && File::isFile(base_path($filePath))) {
                        $filesToCopy[] = $filePath;
                    }
                }
            } else {
                $this->warn("No git modified files detected or git not available. Include manually or use --all.");
            }
        }

        $copiedCount = 0;
        foreach (array_unique($filesToCopy) as $relativePath) {
            $sourceFile = base_path($relativePath);
            $targetFile = $outputDir . '/' . $relativePath;
            $targetDir = dirname($targetFile);

            if (!File::exists($targetDir)) {
                File::makeDirectory($targetDir, 0755, true);
            }

            File::copy($sourceFile, $targetFile);
            $this->line("  + Added: {$relativePath}");
            $copiedCount++;
        }

        $this->info("\n[2/3] Total files collected: {$copiedCount}");

        // Zip update package
        $zipFileName = "update_{$version}.zip";
        $zipPath = base_path($zipFileName);
        $defaultZipPath = base_path("update.zip");

        if (File::exists($zipPath)) File::delete($zipPath);
        if (File::exists($defaultZipPath)) File::delete($defaultZipPath);

        if (!class_exists('ZipArchive')) {
            $this->error("ZipArchive extension is missing. Files collected in 'update_package' directory.");
            return 1;
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $files = File::allFiles($outputDir);
            foreach ($files as $file) {
                $relativePath = $file->getRelativePathname();
                $zip->addFile($file->getPathname(), $relativePath);
            }
            $zip->close();

            // Also copy as standard update.zip
            File::copy($zipPath, $defaultZipPath);

            $this->info("\n[3/3] Update ZIP Package successfully generated!");
            $this->line("--------------------------------------------------");
            $this->info(" Package File 1: " . relative_path($zipPath));
            $this->info(" Package File 2: " . relative_path($defaultZipPath));
            $this->info(" Release Folder: update_package/");
            $this->line("--------------------------------------------------");

            $this->comment("\nHow to deploy:");
            $this->line(" 1. Manual: Upload 'update.zip' directly at /dashboard/system-setting/system-update");
            $this->line(" 2. Cloud CDN: Upload '{$zipFileName}' to R2 CDN and update your latest.json to version {$version}.");
        } else {
            $this->error("Failed to create ZIP package.");
            return 1;
        }

        return 0;
    }
}

function relative_path($path) {
    return str_replace(base_path() . DIRECTORY_SEPARATOR, '', $path);
}
