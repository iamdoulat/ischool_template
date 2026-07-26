<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsBanner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerController extends BaseController
{
    public function index(): JsonResponse
    {
        $banners = FrontCmsBanner::all();
        return $this->success($banners, 'Banners fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'nullable|string',
            'image' => 'required|image|max:2048',
        ]);

        $path = $request->file('image')->store('front-cms/banners', 'public');

        $banner = FrontCmsBanner::create([
            'title' => $request->title,
            'image_path' => Storage::url($path),
        ]);

        return $this->success($banner, 'Banner created successfully', 201);
    }

    public function destroy($id): JsonResponse
    {
        $banner = FrontCmsBanner::find($id);

        if (!$banner) {
            return $this->error('Banner not found', 404);
        }

        // Delete image file from storage
        $imagePath = $banner->image_path;
        if (str_contains($imagePath, '/storage/')) {
            $imagePath = explode('/storage/', $imagePath)[1];
            Storage::disk('public')->delete($imagePath);
        }

        $banner->delete();

        return $this->success(null, 'Banner deleted successfully');
    }
}
