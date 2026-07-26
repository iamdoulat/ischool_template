<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FeeMasterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\FeeMaster::with(['feeGroup', 'feeType', 'session']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->whereHas('feeGroup', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhereHas('feeType', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $feeMasters = $query->latest()->get();

        return response()->json([
            'data' => $feeMasters
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fee_group_id' => 'required|exists:fee_groups,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'due_date' => 'required|date',
            'amount' => 'required|numeric',
            'fine_type' => 'required|string|in:none,percentage,fix,cumulative',
            'fine_percentage' => 'nullable|numeric|required_if:fine_type,percentage',
            'fine_amount' => 'nullable|numeric|required_if:fine_type,fix,cumulative',
            'fine_per_day' => 'nullable|boolean',
            'fine_tiers' => 'nullable|array',
            'session_id' => 'nullable|exists:academic_sessions,id',
        ]);

        $feeMaster = \App\Models\FeeMaster::create($validated);
        $feeMaster->load(['feeGroup', 'feeType', 'session']);

        return response()->json([
            'message' => 'Fees master added successfully',
            'data' => $feeMaster
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $feeMaster = \App\Models\FeeMaster::with(['feeGroup', 'feeType', 'session'])->findOrFail($id);
        return response()->json(['data' => $feeMaster]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $feeMaster = \App\Models\FeeMaster::findOrFail($id);

        $validated = $request->validate([
            'fee_group_id' => 'required|exists:fee_groups,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'due_date' => 'required|date',
            'amount' => 'required|numeric',
            'fine_type' => 'required|string|in:none,percentage,fix,cumulative',
            'fine_percentage' => 'nullable|numeric|required_if:fine_type,percentage',
            'fine_amount' => 'nullable|numeric|required_if:fine_type,fix,cumulative',
            'fine_per_day' => 'nullable|boolean',
            'fine_tiers' => 'nullable|array',
            'session_id' => 'nullable|exists:academic_sessions,id',
        ]);

        $feeMaster->update($validated);
        $feeMaster->load(['feeGroup', 'feeType', 'session']);

        return response()->json([
            'message' => 'Fees master updated successfully',
            'data' => $feeMaster
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $feeMaster = \App\Models\FeeMaster::findOrFail($id);
        $feeMaster->delete();

        return response()->json([
            'message' => 'Fees master deleted successfully'
        ]);
    }

    /**
     * Bulk Delete resources.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:fee_masters,id'
        ]);

        \App\Models\FeeMaster::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => 'Selected fees masters deleted successfully'
        ]);
    }
}
