<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Services\SystemUpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemUpdateController extends BaseController
{
    protected SystemUpdateService $updateService;

    public function __construct(SystemUpdateService $updateService)
    {
        $this->updateService = $updateService;
    }

    /**
     * Get current system version and update info.
     */
    public function index(): JsonResponse
    {
        $version = $this->updateService->getCurrentVersion();

        return $this->sendResponse([
            'version' => $version,
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'zip_enabled' => class_exists('ZipArchive')
        ], 'Current system version retrieved successfully.');
    }

    /**
     * Check for system updates (Remote/GitHub or local).
     */
    public function check(Request $request): JsonResponse
    {
        $customUrl = $request->input('update_url');
        $result = $this->updateService->checkRemoteUpdate($customUrl);

        return $this->sendResponse($result, $result['message']);
    }

    /**
     * Upload an update.zip file and apply backend & database update.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'update_file' => 'required|file|mimes:zip|max:102400', // Max 100MB
        ]);

        $file = $request->file('update_file');
        if (!$file->isValid()) {
            return $this->sendError('Uploaded update file is invalid or corrupted.', [], 400);
        }

        $tempPath = $file->getRealPath();
        $result = $this->updateService->processZipUpdate($tempPath);

        if (!$result['success']) {
            return $this->sendError($result['message'], $result['logs'] ?? [], 422);
        }

        return $this->sendResponse($result, $result['message']);
    }

    /**
     * Install update directly from a remote download URL.
     */
    public function installRemote(Request $request): JsonResponse
    {
        $request->validate([
            'download_url' => 'required|url',
        ]);

        $downloadUrl = $request->input('download_url');
        $result = $this->updateService->downloadAndInstallRemote($downloadUrl);

        if (!$result['success']) {
            return $this->sendError($result['message'], [], 422);
        }

        return $this->sendResponse($result, $result['message']);
    }
}
