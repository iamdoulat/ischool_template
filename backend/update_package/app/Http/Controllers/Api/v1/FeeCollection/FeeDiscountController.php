<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Api\BaseController;
use App\Models\FeeDiscount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FeeDiscountController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $discounts = FeeDiscount::orderBy('created_at', 'desc')->get();
        return $this->success($discounts, 'Fees discounts retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:fee_discounts,code',
            'type' => 'required|in:percentage,fix',
            'amount' => 'required_if:type,fix|nullable|numeric|min:0',
            'percentage' => 'required_if:type,percentage|nullable|numeric|min:0|max:100',
            'use_count' => 'required|integer|min:0',
            'expiry_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $discount = FeeDiscount::create($request->all());

        return $this->success($discount, 'Fees discount created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(FeeDiscount $feeDiscount): JsonResponse
    {
        return $this->success($feeDiscount, 'Fees discount retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FeeDiscount $feeDiscount): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:fee_discounts,code,' . $feeDiscount->id,
            'type' => 'required|in:percentage,fix',
            'amount' => 'required_if:type,fix|nullable|numeric|min:0',
            'percentage' => 'required_if:type,percentage|nullable|numeric|min:0|max:100',
            'use_count' => 'required|integer|min:0',
            'expiry_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $feeDiscount->update($request->all());

        return $this->success($feeDiscount, 'Fees discount updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FeeDiscount $feeDiscount): JsonResponse
    {
        $feeDiscount->delete();
        return $this->success(null, 'Fees discount deleted successfully');
    }
}
