<?php

namespace App\Http\Controllers\Api\v1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Item;
use Illuminate\Support\Facades\Validator;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $items = Item::with('itemCategory')
            ->withSum('itemStocks', 'quantity')
            ->withSum(['issueItems' => function($q) {
                $q->where('status', 'issued');
            }], 'quantity')
            ->when($request->search, function ($query, $search) {
                $query->where('item_name', 'like', "%{$search}%")
                    ->orWhereHas('itemCategory', function($q) use ($search) {
                        $q->where('item_category', 'like', "%{$search}%");
                    });
            })
            ->when($request->item_category_id, function ($query, $category_id) {
                $query->where('item_category_id', $category_id);
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_name' => 'required|string|max:255',
            'item_category_id' => 'required|exists:item_categories,id',
            'unit' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = Item::create($request->all());

        return response()->json([
            'message' => 'Item created successfully',
            'data' => $item->load('itemCategory')
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $validator = Validator::make($request->all(), [
            'item_name' => 'required|string|max:255',
            'item_category_id' => 'required|exists:item_categories,id',
            'unit' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update($request->all());

        return response()->json([
            'message' => 'Item updated successfully',
            'data' => $item->load('itemCategory')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        $item->delete();

        return response()->json([
            'message' => 'Item deleted successfully'
        ]);
    }
}
