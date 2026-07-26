<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\PhoneCallLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PhoneCallLogController extends BaseController
{
    /**
     * Display a listing of the phone call logs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PhoneCallLog::latest();

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        $logs = $query->paginate($request->get('limit', 15));
        return $this->success($logs, 'Phone call logs retrieved successfully');
    }

    /**
     * Store a newly created phone call log.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'next_follow_up_date' => 'nullable|date',
            'call_duration' => 'nullable|string|max:50',
            'note' => 'nullable|string',
            'call_type' => ['required', Rule::in(['Incoming', 'Outgoing'])],
        ]);

        $log = PhoneCallLog::create($validated);
        return $this->success($log, 'Phone call log created successfully', 201);
    }

    /**
     * Display the specified phone call log.
     */
    public function show($id): JsonResponse
    {
        $log = PhoneCallLog::findOrFail($id);
        return $this->success($log, 'Phone call log details retrieved successfully');
    }

    /**
     * Update the specified phone call log.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $log = PhoneCallLog::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'next_follow_up_date' => 'nullable|date',
            'call_duration' => 'nullable|string|max:50',
            'note' => 'nullable|string',
            'call_type' => ['required', Rule::in(['Incoming', 'Outgoing'])],
        ]);

        $log->update($validated);
        return $this->success($log->fresh(), 'Phone call log updated successfully');
    }

    /**
     * Remove the specified phone call log.
     */
    public function destroy($id): JsonResponse
    {
        $log = PhoneCallLog::findOrFail($id);
        $log->delete();
        return $this->success(null, 'Phone call log deleted successfully');
    }

    /**
     * Bulk delete phone call logs.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:phone_call_logs,id',
        ]);

        PhoneCallLog::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected phone call logs deleted successfully');
    }
}
