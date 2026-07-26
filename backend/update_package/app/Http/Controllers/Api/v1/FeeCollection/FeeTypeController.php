<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FeeTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\FeeType::query();

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%");
        }

        $feeTypes = $query->latest()->get();

        return response()->json([
            'data' => $feeTypes
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $feeType = \App\Models\FeeType::create($validated);

        return response()->json([
            'message' => 'Fees type added successfully',
            'data' => $feeType
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $feeType = \App\Models\FeeType::findOrFail($id);
        return response()->json(['data' => $feeType]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $feeType = \App\Models\FeeType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $feeType->update($validated);

        return response()->json([
            'message' => 'Fees type updated successfully',
            'data' => $feeType
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $feeType = \App\Models\FeeType::findOrFail($id);
        $feeType->delete();

        return response()->json([
            'message' => 'Fees type deleted successfully'
        ]);
    }

    /**
     * Bulk Delete resources.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:fee_types,id'
        ]);

        \App\Models\FeeType::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => 'Selected fees types deleted successfully'
        ]);
    }
}
