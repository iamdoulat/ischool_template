<?php

namespace App\Http\Controllers\Api\v1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ItemCategory;
use Illuminate\Support\Facades\Validator;

class ItemCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $categories = ItemCategory::query()
            ->when($request->search, function ($query, $search) {
                $query->where('item_category', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_category' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = ItemCategory::create($request->all());

        return response()->json([
            'message' => 'Item Category created successfully',
            'data' => $category
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ItemCategory $itemCategory)
    {
        $validator = Validator::make($request->all(), [
            'item_category' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $itemCategory->update($request->all());

        return response()->json([
            'message' => 'Item Category updated successfully',
            'data' => $itemCategory
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ItemCategory $itemCategory)
    {
        $itemCategory->delete();

        return response()->json([
            'message' => 'Item Category deleted successfully'
        ]);
    }
}
