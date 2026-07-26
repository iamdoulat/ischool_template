<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsGallery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends BaseController
{
    public function index(): JsonResponse
    {
        $gallery = FrontCmsGallery::all();
        return $this->success($gallery, 'Gallery fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'image' => 'required|image|max:2048',
        ]);

        $path = $request->file('image')->store('front-cms/gallery', 'public');

        $gallery = FrontCmsGallery::create([
            'title' => $request->title,
            'description' => $request->description,
            'image_path' => Storage::url($path),
        ]);

        return $this->success($gallery, 'Gallery item created successfully', 201);
    }

    public function destroy($id): JsonResponse
    {
        $gallery = FrontCmsGallery::find($id);

        if (!$gallery) {
            return $this->error('Gallery item not found', 404);
        }

        $gallery->delete();

        return $this->success(null, 'Gallery item deleted successfully');
    }
}
