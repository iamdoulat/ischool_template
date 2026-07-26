<?php

namespace App\Http\Controllers\Api\v1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ItemSupplier;
use Illuminate\Support\Facades\Validator;

class ItemSupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $suppliers = ItemSupplier::query()
            ->when($request->search, function ($query, $search) {
                $query->where('item_supplier', 'like', "%{$search}%")
                    ->orWhere('contact_person_name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($suppliers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_supplier' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_person_phone' => 'nullable|string|max:20',
            'contact_person_email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $supplier = ItemSupplier::create($request->all());

        return response()->json([
            'message' => 'Item Supplier created successfully',
            'data' => $supplier
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ItemSupplier $itemSupplier)
    {
        $validator = Validator::make($request->all(), [
            'item_supplier' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_person_phone' => 'nullable|string|max:20',
            'contact_person_email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $itemSupplier->update($request->all());

        return response()->json([
            'message' => 'Item Supplier updated successfully',
            'data' => $itemSupplier
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ItemSupplier $itemSupplier)
    {
        $itemSupplier->delete();

        return response()->json([
            'message' => 'Item Supplier deleted successfully'
        ]);
    }
}
