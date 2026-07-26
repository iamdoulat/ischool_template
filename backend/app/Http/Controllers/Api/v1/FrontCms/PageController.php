<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsPage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends BaseController
{
    public function index(): JsonResponse
    {
        $pages = FrontCmsPage::all();
        return $this->success($pages, 'Pages fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'url' => 'nullable|string',
            'page_type' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $validated['page_type'] = $validated['page_type'] ?? 'Standard';
        $validated['is_system'] = false; // user created pages are never system

        $page = FrontCmsPage::create($validated);

        return $this->success($page, 'Page created successfully', 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $page = FrontCmsPage::find($id);

        if (!$page) {
            return $this->error('Page not found', 404);
        }

        $validated = $request->validate([
            'title' => 'required|string',
            'url' => 'nullable|string',
            'page_type' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $validated['page_type'] = $validated['page_type'] ?? 'Standard';

        $page->update($validated);

        return $this->success($page, 'Page updated successfully');
    }

    public function destroy($id): JsonResponse
    {
        $page = FrontCmsPage::find($id);

        if (!$page) {
            return $this->error('Page not found', 404);
        }

        if ($page->is_system) {
            return $this->error('Cannot delete system page', 403);
        }

        $page->delete();

        return $this->success(null, 'Page deleted successfully');
    }

    public function showBySlug($slug): JsonResponse
    {
        // Add leading slash if missing
        $url = $slug === 'home' ? '/' : (str_starts_with($slug, '/') ? $slug : '/' . $slug);
        
        $page = FrontCmsPage::where('url', $url)->first();

        if (!$page) {
            return $this->error('Page not found', 200);
        }

        return $this->success($page, 'Page fetched successfully');
    }
}
