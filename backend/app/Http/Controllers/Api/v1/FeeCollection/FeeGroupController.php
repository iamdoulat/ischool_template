<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FeeGroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\FeeGroup::query();

        if ($request->has('school_class_id') && $request->school_class_id != '') {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $feeGroups = $query->latest()->get();

        return response()->json([
            'data' => $feeGroups
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->all();
        if (empty($data['school_class_id'])) {
            $data['school_class_id'] = null;
        }
        $request->replace($data);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        $feeGroup = \App\Models\FeeGroup::create($validated);

        return response()->json([
            'message' => 'Fees group added successfully',
            'data' => $feeGroup
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $feeGroup = \App\Models\FeeGroup::findOrFail($id);
        return response()->json(['data' => $feeGroup]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $feeGroup = \App\Models\FeeGroup::findOrFail($id);

        $data = $request->all();
        if (empty($data['school_class_id'])) {
            $data['school_class_id'] = null;
        }
        $request->replace($data);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        $feeGroup->update($validated);

        return response()->json([
            'message' => 'Fees group updated successfully',
            'data' => $feeGroup
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $feeGroup = \App\Models\FeeGroup::findOrFail($id);
        $feeGroup->delete();

        return response()->json([
            'message' => 'Fees group deleted successfully'
        ]);
    }

    /**
     * Bulk Delete resources.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:fee_groups,id'
        ]);

        \App\Models\FeeGroup::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => 'Selected fees groups deleted successfully'
        ]);
    }
}
