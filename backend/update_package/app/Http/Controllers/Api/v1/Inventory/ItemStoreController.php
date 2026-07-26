<?php

namespace App\Http\Controllers\Api\v1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ItemStore;
use Illuminate\Support\Facades\Validator;

class ItemStoreController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $stores = ItemStore::query()
            ->when($request->search, function ($query, $search) {
                $query->where('item_store', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($stores);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_store' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $store = ItemStore::create($request->all());

        return response()->json([
            'message' => 'Item Store created successfully',
            'data' => $store
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ItemStore $itemStore)
    {
        $validator = Validator::make($request->all(), [
            'item_store' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $itemStore->update($request->all());

        return response()->json([
            'message' => 'Item Store updated successfully',
            'data' => $itemStore
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ItemStore $itemStore)
    {
        $itemStore->delete();

        return response()->json([
            'message' => 'Item Store deleted successfully'
        ]);
    }
}
