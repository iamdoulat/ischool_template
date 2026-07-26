<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ExpenseHeadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $heads = \App\Models\ExpenseHead::all();
        return response()->json([
            'status' => 'Success',
            'data' => $heads
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_head' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $head = \App\Models\ExpenseHead::create($validated);

        return response()->json([
            'status' => 'Success',
            'message' => 'Expense Head created successfully',
            'data' => $head
        ]);
    }

    public function show(string $id)
    {
        $head = \App\Models\ExpenseHead::findOrFail($id);
        return response()->json([
            'status' => 'Success',
            'data' => $head
        ]);
    }

    public function update(Request $request, string $id)
    {
        $head = \App\Models\ExpenseHead::findOrFail($id);

        $validated = $request->validate([
            'expense_head' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $head->update($validated);

        return response()->json([
            'status' => 'Success',
            'message' => 'Expense Head updated successfully',
            'data' => $head
        ]);
    }

    public function destroy(string $id)
    {
        $head = \App\Models\ExpenseHead::findOrFail($id);
        $head->delete();

        return response()->json([
            'status' => 'Success',
            'message' => 'Expense Head deleted successfully'
        ]);
    }
}
