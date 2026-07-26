<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\DisableReason;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisableReasonController extends BaseController
{
    /**
     * Display a listing of the disable reasons.
     */
    public function index(): JsonResponse
    {
        $reasons = DisableReason::latest()->get();
        return $this->success($reasons, 'Disable reasons retrieved successfully');
    }

    /**
     * Store a newly created disable reason.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255|unique:disable_reasons',
        ]);

        $reason = DisableReason::create($validated);
        return $this->success($reason, 'Disable reason created successfully', 201);
    }

    /**
     * Update the specified disable reason.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $reason = DisableReason::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|max:255|unique:disable_reasons,reason,' . $id,
        ]);

        $reason->update($validated);
        return $this->success($reason, 'Disable reason updated successfully');
    }

    /**
     * Remove the specified disable reason.
     */
    public function destroy($id): JsonResponse
    {
        $reason = DisableReason::findOrFail($id);
        $reason->delete();
        return $this->success(null, 'Disable reason deleted successfully');
    }

    /**
     * Bulk delete disable reasons.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:disable_reasons,id',
        ]);

        DisableReason::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected reasons deleted successfully');
    }
}
