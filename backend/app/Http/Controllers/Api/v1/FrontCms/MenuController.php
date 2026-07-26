<?php

namespace App\Http\Controllers\Api\v1\FrontCms;

use App\Http\Controllers\Api\BaseController;
use App\Models\FrontCmsMenu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends BaseController
{
    public function index(): JsonResponse
    {
        $menus = FrontCmsMenu::whereNull('parent_id')
            ->with('subItems')
            ->orderBy('order', 'asc')
            ->get();

        return $this->success($menus, 'Menus fetched successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'is_external' => 'nullable|boolean',
            'open_new_tab' => 'nullable|boolean',
            'url' => 'nullable|string',
            'page' => 'nullable|string',
            'type' => 'nullable|string',
            'parent_id' => 'nullable|exists:front_cms_menus,id',
            'order' => 'nullable|integer',
            'column' => 'nullable|integer',
        ]);

        $validated['is_external'] = $validated['is_external'] ?? false;
        $validated['open_new_tab'] = $validated['open_new_tab'] ?? false;

        $menu = FrontCmsMenu::create($validated);

        return $this->success($menu, 'Menu created successfully', 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $menu = FrontCmsMenu::find($id);

        if (!$menu) {
            return $this->error('Menu not found', 404);
        }

        $validated = $request->validate([
            'title' => 'required|string',
            'is_external' => 'nullable|boolean',
            'open_new_tab' => 'nullable|boolean',
            'url' => 'nullable|string',
            'page' => 'nullable|string',
            'type' => 'nullable|string',
            'parent_id' => 'nullable|exists:front_cms_menus,id',
            'order' => 'nullable|integer',
            'column' => 'nullable|integer',
        ]);

        $validated['is_external'] = $validated['is_external'] ?? false;
        $validated['open_new_tab'] = $validated['open_new_tab'] ?? false;

        $menu->update($validated);

        return $this->success($menu, 'Menu updated successfully');
    }

    public function destroy($id): JsonResponse
    {
        $menu = FrontCmsMenu::find($id);

        if (!$menu) {
            return $this->error('Menu not found', 404);
        }

        // Delete sub-items first
        FrontCmsMenu::where('parent_id', $menu->id)->delete();
        
        $menu->delete();

        return $this->success(null, 'Menu deleted successfully');
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:front_cms_menus,id',
            'items.*.order' => 'required|integer'
        ]);

        foreach ($validated['items'] as $item) {
            FrontCmsMenu::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return $this->success(null, 'Menus reordered successfully');
    }
}
