<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitorController extends BaseController
{
    /**
     * Display a listing of the visitors.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Visitor::latest();

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('visitor_name', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%')
                    ->orWhere('id_card', 'like', '%' . $request->search . '%')
                    ->orWhere('purpose', 'like', '%' . $request->search . '%')
                    ->orWhere('source', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        }

        $visitors = $query->get();
        return $this->success($visitors, 'Visitors retrieved successfully');
    }

    /**
     * Store a newly created visitor entry.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purpose' => 'required|string|max:255',
            'meeting_with' => 'required|string|max:255',
            'visitor_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'id_card' => 'nullable|string|max:255',
            'number_of_person' => 'required|integer|min:1',
            'date' => 'required|date',
            'in_time' => 'required',
            'out_time' => 'nullable',
            'note' => 'nullable|string',
            'attachment' => 'nullable|string',
            'source' => 'nullable|string|max:255',
        ]);

        $visitor = Visitor::create($validated);
        return $this->success($visitor, 'Visitor entry created successfully', 201);
    }

    /**
     * Display the specified visitor entry.
     */
    public function show($id): JsonResponse
    {
        $visitor = Visitor::findOrFail($id);
        return $this->success($visitor, 'Visitor details retrieved successfully');
    }

    /**
     * Update the specified visitor entry.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $visitor = Visitor::findOrFail($id);

        $validated = $request->validate([
            'purpose' => 'required|string|max:255',
            'meeting_with' => 'required|string|max:255',
            'visitor_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'id_card' => 'nullable|string|max:255',
            'number_of_person' => 'required|integer|min:1',
            'date' => 'required|date',
            'in_time' => 'required',
            'out_time' => 'nullable',
            'note' => 'nullable|string',
            'attachment' => 'nullable|string',
            'source' => 'nullable|string|max:255',
        ]);

        $visitor->update($validated);
        return $this->success($visitor, 'Visitor entry updated successfully');
    }

    /**
     * Remove the specified visitor entry.
     */
    public function destroy($id): JsonResponse
    {
        $visitor = Visitor::findOrFail($id);
        $visitor->delete();
        return $this->success(null, 'Visitor entry deleted successfully');
    }

    /**
     * Bulk delete visitor entries.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:visitors,id',
        ]);

        Visitor::whereIn('id', $validated['ids'])->delete();

        return $this->success(null, 'Selected visitor entries deleted successfully');
    }
}
