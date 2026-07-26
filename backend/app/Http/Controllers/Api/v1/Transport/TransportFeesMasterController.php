<?php

namespace App\Http\Controllers\Api\v1\Transport;

use App\Http\Controllers\Api\BaseController;
use App\Models\TransportFeeMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TransportFeesMasterController extends BaseController
{
    public function index()
    {
        $activeSessionId = \App\Models\AcademicSession::where('is_active', true)->value('id');
        
        $fees = TransportFeeMaster::when($activeSessionId, function ($q) use ($activeSessionId) {
            $q->where('session_id', $activeSessionId)->orWhereNull('session_id');
        })->orderBy('id', 'asc')->get();

        if ($fees->isEmpty()) {
            $fees = TransportFeeMaster::orderBy('id', 'asc')->get();
        }

        // Auto-seed default months if transport_fee_masters table is completely empty
        if ($fees->isEmpty()) {
            $defaultMonths = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            foreach ($defaultMonths as $month) {
                TransportFeeMaster::create([
                    'month' => $month,
                    'fine_type' => 'none',
                    'session_id' => $activeSessionId,
                ]);
            }
            $fees = TransportFeeMaster::orderBy('id', 'asc')->get();
        }

        return $this->success($fees, 'Transport fee masters retrieved successfully');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fees' => 'required|array',
            'fees.*.month' => 'required|string',
            'fees.*.due_date' => 'nullable|string',
            'fees.*.fine_type' => 'required|string|in:none,percentage,fix',
            'fees.*.fine_percentage' => 'nullable|numeric',
            'fees.*.fine_amount' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $session_id = \App\Models\AcademicSession::where('is_active', true)->value('id');

        foreach ($request->input('fees') as $feeData) {
            $dueDate = null;
            if (!empty($feeData['due_date'])) {
                $dueDate = Carbon::parse($feeData['due_date'])->format('Y-m-d');
            }

            TransportFeeMaster::updateOrCreate(
                ['month' => $feeData['month'], 'session_id' => $session_id],
                [
                    'due_date' => $dueDate,
                    'fine_type' => $feeData['fine_type'],
                    'fine_percentage' => $feeData['fine_percentage'] ?? null,
                    'fine_amount' => $feeData['fine_amount'] ?? null,
                ]
            );
        }

        $updatedFees = TransportFeeMaster::where('session_id', $session_id)->get();
        return $this->success($updatedFees, 'Transport fee masters updated successfully');
    }
}
