<?php

namespace App\Http\Controllers\Api\v1\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\IssueItem;
use Illuminate\Support\Facades\Validator;

class IssueItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $issues = IssueItem::with(['item', 'itemCategory'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('item', function($q) use ($search) {
                    $q->where('item_name', 'like', "%{$search}%");
                })->orWhere('issue_to', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return response()->json($issues);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_category_id' => 'required|exists:item_categories,id',
            'item_id' => 'required|exists:items,id',
            'user_type' => 'required|string|in:staff,student',
            'issue_to' => 'required', // Should be ID, but simplified for now
            'issue_by' => 'required',
            'issue_date' => 'required|date',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $issue = IssueItem::create($request->all());

        return response()->json([
            'message' => 'Item Issued successfully',
            'data' => $issue->load(['item', 'itemCategory'])
        ], 201);
    }

    /**
     * Update the specified resource (Return Item).
     */
    public function update(Request $request, IssueItem $issueItem)
    {
        if ($request->has('status') && $request->status === 'returned') {
            $issueItem->update([
                'status' => 'returned',
                'return_date' => now()->toDateString()
            ]);

            return response()->json([
                'message' => 'Item returned successfully',
                'data' => $issueItem->load(['item', 'itemCategory'])
            ]);
        }

        // Generic update for other fields if needed
        $issueItem->update($request->all());

        return response()->json([
            'message' => 'Issue record updated successfully',
            'data' => $issueItem->load(['item', 'itemCategory'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IssueItem $issueItem)
    {
        $issueItem->delete();

        return response()->json([
            'message' => 'Issue record deleted successfully'
        ]);
    }
}
