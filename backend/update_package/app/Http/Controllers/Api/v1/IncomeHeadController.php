<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class IncomeHeadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $incomeHeads = \App\Models\IncomeHead::all();
        return response()->json([
            'status' => 'Success',
            'data' => $incomeHeads
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'income_head' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $incomeHead = \App\Models\IncomeHead::create($validated);

        return response()->json([
            'status' => 'Success',
            'message' => 'Income Head created successfully',
            'data' => $incomeHead
        ]);
    }

    public function show(string $id)
    {
        $incomeHead = \App\Models\IncomeHead::findOrFail($id);
        return response()->json([
            'status' => 'Success',
            'data' => $incomeHead
        ]);
    }

    public function update(Request $request, string $id)
    {
        $incomeHead = \App\Models\IncomeHead::findOrFail($id);

        $validated = $request->validate([
            'income_head' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $incomeHead->update($validated);

        return response()->json([
            'status' => 'Success',
            'message' => 'Income Head updated successfully',
            'data' => $incomeHead
        ]);
    }

    public function destroy(string $id)
    {
        $incomeHead = \App\Models\IncomeHead::findOrFail($id);
        $incomeHead->delete();

        return response()->json([
            'status' => 'Success',
            'message' => 'Income Head deleted successfully'
        ]);
    }
}
