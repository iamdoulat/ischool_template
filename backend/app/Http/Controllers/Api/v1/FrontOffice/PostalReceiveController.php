<?php

namespace App\Http\Controllers\Api\v1\FrontOffice;

use App\Http\Controllers\Api\BaseController;
use App\Models\PostalReceive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PostalReceiveController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PostalReceive::latest();

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('from_title', 'like', '%' . $request->search . '%')
                    ->orWhere('to_title', 'like', '%' . $request->search . '%')
                    ->orWhere('reference_no', 'like', '%' . $request->search . '%');
            });
        }

        $receives = $query->paginate($request->get('limit', 15));
        return $this->success($receives, 'Postal receives retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from_title' => 'required|string|max:255',
            'reference_no' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'note' => 'nullable|string',
            'to_title' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'attachment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $receive = PostalReceive::create($request->all());
        return $this->success($receive, 'Postal receive created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PostalReceive $postalReceive): JsonResponse
    {
        return $this->success($postalReceive, 'Postal receive details retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PostalReceive $postalReceive): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from_title' => 'required|string|max:255',
            'reference_no' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'note' => 'nullable|string',
            'to_title' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'attachment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $postalReceive->update($request->all());
        return $this->success($postalReceive->fresh(), 'Postal receive updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PostalReceive $postalReceive): JsonResponse
    {
        $postalReceive->delete();
        return $this->success(null, 'Postal receive deleted successfully');
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

        PostalReceive::whereIn('id', $ids)->delete();
        return $this->success(null, count($ids) . ' postal receives deleted successfully');
    }
}
