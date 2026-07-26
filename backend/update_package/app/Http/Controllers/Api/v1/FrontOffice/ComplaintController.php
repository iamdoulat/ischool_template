<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ComplaintController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Complaint::latest();

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('complain_by', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%')
                    ->orWhere('complaint_type', 'like', '%' . $request->search . '%')
                    ->orWhere('source', 'like', '%' . $request->search . '%');
            });
        }

        $complaints = $query->paginate($request->get('limit', 15));
        return $this->success($complaints, 'Complaints retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'complaint_type' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'complain_by' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'date' => 'nullable|date',
            'description' => 'nullable|string',
            'action_taken' => 'nullable|string|max:255',
            'assigned' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'attachment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $complaint = DB::transaction(function () use ($request) {
            $data = $request->except('complaint_id');
            $data['complaint_id'] = $this->generateComplaintId();
            return Complaint::create($data);
        });

        return $this->success($complaint, 'Complaint created successfully', 201);
    }

    private function generateComplaintId(): string
    {
        $prefix = now()->format('my');
        $last = Complaint::where('complaint_id', 'like', "%-{$prefix}")
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->value('complaint_id');
        if ($last && preg_match('/^(\d+)-/', $last, $m)) {
            $next = (int)$m[1] + 1;
        } else {
            $next = 1;
        }
        return str_pad($next, 2, '0', STR_PAD_LEFT) . '-' . $prefix;
    }

    /**
     * Display the specified resource.
     */
    public function show(Complaint $complaint): JsonResponse
    {
        return $this->success($complaint, 'Complaint details retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'complaint_type' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'complain_by' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'date' => 'nullable|date',
            'description' => 'nullable|string',
            'action_taken' => 'nullable|string|max:255',
            'assigned' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'attachment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        // Exclude complaint_id from update to avoid unique constraint violation
        $complaint->update($request->except('complaint_id'));
        return $this->success($complaint->fresh(), 'Complaint updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Complaint $complaint): JsonResponse
    {
        $complaint->delete();
        return $this->success(null, 'Complaint deleted successfully');
    }

    /**
     * Bulk delete resources.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return $this->error('No IDs provided for deletion', 400);
        }

        Complaint::whereIn('id', $ids)->delete();
        return $this->success(null, count($ids) . ' complaints deleted successfully');
    }
}
