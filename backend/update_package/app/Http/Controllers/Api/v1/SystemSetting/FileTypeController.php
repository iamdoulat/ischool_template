<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\FileUploadSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FileTypeController extends BaseController
{
    /**
     * Get the (single-row) file upload settings, creating defaults if absent.
     */
    public function index(): JsonResponse
    {
        $setting = FileUploadSetting::firstOrCreate([]);
        return $this->success($setting, 'File upload settings fetched successfully');
    }

    /**
     * Update the file upload settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file_extension' => 'nullable|string',
            'file_mime' => 'nullable|string',
            'file_size' => 'nullable|integer|min:0',
            'image_extension' => 'nullable|string',
            'image_mime' => 'nullable|string',
            'image_size' => 'nullable|integer|min:0',
        ]);

        $setting = FileUploadSetting::firstOrCreate([]);
        $setting->update($validated);

        return $this->success($setting, 'File upload settings updated successfully');
    }
}
