<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends BaseController
{
    public function index(): JsonResponse
    {
        $media = FrontCmsMedia::orderBy('created_at', 'desc')->get();
        return $this->success($media, 'Media fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'files.*' => 'required|file|max:5120', // Max 5MB per file
        ]);

        $uploadedMedia = [];

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $originalName = $file->getClientOriginalName();
                $type = $file->getMimeType();
                $size = round($file->getSize() / 1024, 2) . ' KB';
                
                $path = $file->store('front-cms/media', 'public');
                
                $media = FrontCmsMedia::create([
                    'file_name' => $originalName,
                    'file_type' => $type,
                    'file_path' => Storage::url($path),
                    'file_size' => $size,
                ]);
                
                $uploadedMedia[] = $media;
            }
        }

        return $this->success($uploadedMedia, 'Media uploaded successfully', 201);
    }

    public function destroy($id): JsonResponse
    {
        $media = FrontCmsMedia::find($id);

        if (!$media) {
            return $this->error('Media not found', 404);
        }

        // Delete physical file from storage
        $path = str_replace('/storage/', '', $media->file_path);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $media->delete();

        return $this->success(null, 'Media deleted successfully');
    }
}
