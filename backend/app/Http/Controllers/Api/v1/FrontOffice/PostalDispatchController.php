<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\PostalDispatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostalDispatchController extends BaseController
{
    /**
     * Display a listing of the postal dispatches.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PostalDispatch::latest();

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('to_title', 'like', '%' . $request->search . '%')
                    ->orWhere('reference_no', 'like', '%' . $request->search . '%')
                    ->orWhere('from_title', 'like', '%' . $request->search . '%');
            });
        }

        $dispatches = $query->paginate($request->get('limit', 15));
        return $this->success($dispatches, 'Postal dispatches retrieved successfully');
    }

    /**
     * Store a newly created postal dispatch.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to_title' => 'required|string|max:255',
            'reference_no' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'note' => 'nullable|string',
            'from_title' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'attachment' => 'nullable|string',
        ]);

        $dispatch = PostalDispatch::create($validated);
        return $this->success($dispatch, 'Postal dispatch created successfully', 201);
    }

    /**
     * Display the specified postal dispatch.
     */
    public function show($id): JsonResponse
    {
        $dispatch = PostalDispatch::findOrFail($id);
        return $this->success($dispatch, 'Postal dispatch details retrieved successfully');
    }

    /**
     * Update the specified postal dispatch.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $dispatch = PostalDispatch::findOrFail($id);

        $validated = $request->validate([
            'to_title' => 'required|string|max:255',
            'reference_no' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'note' => 'nullable|string',
            'from_title' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'attachment' => 'nullable|string',
        ]);

        $dispatch->update($validated);
        return $this->success($dispatch->fresh(), 'Postal dispatch updated successfully');
    }

    /**
     * Remove the specified postal dispatch.
     */
    public function destroy($id): JsonResponse
    {
        $dispatch = PostalDispatch::findOrFail($id);
        $dispatch->delete();
        return $this->success(null, 'Postal dispatch deleted successfully');
    }

    /**
     * Bulk delete postal dispatches.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:postal_dispatches,id',
        ]);

        PostalDispatch::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected postal dispatches deleted successfully');
    }
}
