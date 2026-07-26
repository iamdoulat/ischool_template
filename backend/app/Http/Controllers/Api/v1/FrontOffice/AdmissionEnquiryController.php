<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\AdmissionEnquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdmissionEnquiryController extends BaseController
{
    /**
     * Display a listing of the admission enquiries.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AdmissionEnquiry::latest();

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        }

        // Search across name, phone and email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Server-side pagination (frontend sends page + limit)
        $limit = (int) $request->input('limit', 50);
        $enquiries = $query->paginate($limit);

        return $this->success($enquiries, 'Admission enquiries retrieved successfully');
    }

    /**
     * Store a newly created admission enquiry.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'note' => 'nullable|string',
            'date' => 'required|date',
            'next_follow_up_date' => 'nullable|date',
            'assigned' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'class_id' => 'nullable|exists:school_classes,id',
            'no_of_child' => 'nullable|integer|min:1',
            'status' => ['nullable', Rule::in(['Active', 'Passive', 'Dead', 'Won', 'Lost'])],
        ]);

        $enquiry = AdmissionEnquiry::create($validated);
        return $this->success($enquiry, 'Admission enquiry created successfully', 201);
    }

    /**
     * Update the specified admission enquiry.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $enquiry = AdmissionEnquiry::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'note' => 'nullable|string',
            'date' => 'required|date',
            'next_follow_up_date' => 'nullable|date',
            'assigned' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'class_id' => 'nullable|exists:school_classes,id',
            'no_of_child' => 'nullable|integer|min:1',
            'status' => ['nullable', Rule::in(['Active', 'Passive', 'Dead', 'Won', 'Lost'])],
        ]);

        $enquiry->update($validated);
        return $this->success($enquiry, 'Admission enquiry updated successfully');
    }

    /**
     * Remove the specified admission enquiry.
     */
    public function destroy($id): JsonResponse
    {
        $enquiry = AdmissionEnquiry::findOrFail($id);
        $enquiry->delete();
        return $this->success(null, 'Admission enquiry deleted successfully');
    }

    /**
     * Bulk delete admission enquiries.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:admission_enquiries,id',
        ]);

        AdmissionEnquiry::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected enquiries deleted successfully');
    }
}
