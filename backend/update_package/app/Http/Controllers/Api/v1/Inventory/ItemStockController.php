<?php

namespace App\Http\Controllers\Api\v1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ItemStock;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ItemStockController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $stocks = ItemStock::with(['item', 'itemCategory', 'supplier', 'store'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('item', function($q) use ($search) {
                    $q->where('item_name', 'like', "%{$search}%");
                })->orWhereHas('itemCategory', function($q) use ($search) {
                    $q->where('item_category', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($stocks);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_category_id' => 'required|exists:item_categories,id',
            'item_id' => 'required|exists:items,id',
            'item_supplier_id' => 'nullable|exists:item_suppliers,id',
            'item_store_id' => 'nullable|exists:item_stores,id',
            'quantity' => 'required|integer',
            'purchase_price' => 'required|numeric',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'document' => 'nullable|file|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except('document');

        if ($request->hasFile('document')) {
            $data['document'] = $request->file('document')->store('inventory/stocks', 'public');
        }

        $stock = ItemStock::create($data);

        return response()->json([
            'message' => 'Item Stock created successfully',
            'data' => $stock->load(['item', 'itemCategory', 'supplier', 'store'])
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ItemStock $itemStock)
    {
        $validator = Validator::make($request->all(), [
            'item_category_id' => 'required|exists:item_categories,id',
            'item_id' => 'required|exists:items,id',
            'item_supplier_id' => 'nullable|exists:item_suppliers,id',
            'item_store_id' => 'nullable|exists:item_stores,id',
            'quantity' => 'required|integer',
            'purchase_price' => 'required|numeric',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'document' => 'nullable|file|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except('document');

        if ($request->hasFile('document')) {
            if ($itemStock->document) {
                Storage::disk('public')->delete($itemStock->document);
            }
            $data['document'] = $request->file('document')->store('inventory/stocks', 'public');
        }

        $itemStock->update($data);

        return response()->json([
            'message' => 'Item Stock updated successfully',
            'data' => $itemStock->load(['item', 'itemCategory', 'supplier', 'store'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ItemStock $itemStock)
    {
        if ($itemStock->document) {
            Storage::disk('public')->delete($itemStock->document);
        }
        
        $itemStock->delete();

        return response()->json([
            'message' => 'Item Stock deleted successfully'
        ]);
    }
}
