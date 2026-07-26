<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsNews;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NewsController extends BaseController
{
    public function index(): JsonResponse
    {
        $news = FrontCmsNews::orderBy('date', 'desc')->get();
        return $this->success($news, 'News fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('front-cms/news', 'public');
            $imagePath = Storage::url($path);
        }

        $news = FrontCmsNews::create([
            'title' => $request->title,
            'date' => $request->date,
            'description' => $request->description,
            'image_path' => $imagePath,
        ]);

        return $this->success($news, 'News created successfully', 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $news = FrontCmsNews::find($id);

        if (!$news) {
            return $this->error('News not found', 404);
        }

        $request->validate([
            'title' => 'required|string',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('front-cms/news', 'public');
            $news->image_path = Storage::url($path);
        }

        $news->update([
            'title' => $request->title,
            'date' => $request->date,
            'description' => $request->description,
        ]);

        return $this->success($news, 'News updated successfully');
    }

    public function destroy($id): JsonResponse
    {
        $news = FrontCmsNews::find($id);

        if (!$news) {
            return $this->error('News not found', 404);
        }

        $news->delete();

        return $this->success(null, 'News deleted successfully');
    }
}
