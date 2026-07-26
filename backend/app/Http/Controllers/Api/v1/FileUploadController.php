<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadController extends BaseController
{
    /**
     * Upload a file for authenticated users.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'nullable|string|in:avatar,document,general',
        ]);

        $file = $request->file('file');
        $type = $request->input('type', 'general');

        // Validate file types based on upload type
        $allowedMimes = [
            'avatar' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            'document' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            'general' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        ];

        if (!in_array($file->getMimeType(), $allowedMimes[$type])) {
            return $this->error('Invalid file type for this upload category', 422);
        }

        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(40) . '.' . $extension;

        // Store file in appropriate directory based on type
        // If type is 'avatar', store in 'avatars', etc.
        $folder = $type === 'general' ? 'uploads' : Str::plural($type);
        $path = $file->storeAs($folder, $filename, 'public');

        // Copy file to physical public directories as fallbacks for web servers without storage symlinks
        try {
            $publicStorageDir = public_path('storage/' . $folder);
            if (!file_exists($publicStorageDir)) {
                @mkdir($publicStorageDir, 0755, true);
            }
            @copy(storage_path('app/public/' . $path), public_path('storage/' . $path));

            $publicFolderDir = public_path($folder);
            if (!file_exists($publicFolderDir)) {
                @mkdir($publicFolderDir, 0755, true);
            }
            @copy(storage_path('app/public/' . $path), public_path($path));
        } catch (\Throwable $e) {
            // Ignore copy exceptions
        }

        // Generate public URL (absolute if APP_URL is set correctly)
        $url = asset('storage/' . $path);

        return $this->success([
            'filename' => $filename,
            'path' => $path,
            'url' => $url,
            'type' => $type,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ], 'File uploaded successfully', 201);
    }

    /**
     * Delete a file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function delete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => 'required|string',
        ]);

        $path = $validated['path'];

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
            return $this->success(null, 'File deleted successfully');
        }

        return $this->error('File not found', 404);
    }
}
