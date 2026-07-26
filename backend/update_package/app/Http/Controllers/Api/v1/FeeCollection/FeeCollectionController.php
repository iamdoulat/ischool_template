<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\StudentFeeMaster;
use App\Models\FeePayment;
use App\Models\FeeGroup;
use App\Models\FeeType;
use App\Models\FeeMaster;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FeeCollectionController extends BaseController
{
    /**
     * Search students for fee collection.
     */
    public function searchStudents(Request $request): JsonResponse
    {
        $query = User::role('Student');

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->filled('section_id')) {
            $section = \App\Models\Section::find($request->section_id);
            if ($section) {
                $sameNameIds = \App\Models\Section::where('name', $section->name)->pluck('id')->toArray();
                $query->where(function ($sq) use ($request, $sameNameIds) {
                    $sq->whereIn('section_id', $sameNameIds)
                       ->orWhereNull('section_id');
                });
            } else {
                $query->where(function ($sq) use ($request) {
                    $sq->where('section_id', $request->section_id)
                       ->orWhereNull('section_id');
                });
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_no', 'like', "%{$search}%")
                    ->orWhere('roll_no', 'like', "%{$search}%")
                    ->orWhere('father_name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        // Sort class and section wise
        $query->orderBy('school_class_id')
              ->orderBy('section_id')
              ->latest();

        if ($request->boolean('no_paginate')) {
            $students = $query->with(['schoolClass', 'section'])->get();
        } else {
            $students = $query->with(['schoolClass', 'section'])->paginate($request->get('limit', 50));
        }

        \Illuminate\Support\Facades\Log::info('QuickFees SearchStudents', [
            'class_id' => $request->school_class_id,
            'section_id' => $request->section_id,
            'no_paginate' => $request->boolean('no_paginate'),
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings(),
            'students_count' => count($students)
        ]);

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Get fees for a specific student.
     */
    public function getStudentFees($id): JsonResponse
    {
        $student = User::with(['schoolClass', 'section', 'feesGroups'])->findOrFail($id);

        $fees = StudentFeeMaster::with(['feeMaster.feeType', 'feeMaster.feeGroup', 'payments'])
            ->where('student_id', $id)
            ->get();

        $transportFeesRaw = \App\Models\StudentTransportFee::with(['transportFeeMaster', 'payments'])
            ->where('student_id', $id)
            ->get();

        $transportFees = $transportFeesRaw->map(function($tFee) {
            return (object) [
                'id' => $tFee->id,
                'is_transport' => true,
                'transport_fee_master_id' => $tFee->transport_fee_master_id,
                'fee_master' => (object) [
                    'amount' => $tFee->amount,
                    'fee_group' => (object) ['name' => 'Transport Fee'],
                    'fee_type' => (object) ['name' => $tFee->transportFeeMaster->month ?? 'Transport', 'code' => 'TRN'],
                    'due_date' => $tFee->transportFeeMaster->due_date ?? null,
                    'fine_amount' => $tFee->transportFeeMaster->fine_amount ?? 0,
                ],
                'payments' => $tFee->payments,
            ];
        });

        $allFees = $fees->concat($transportFees);

        return $this->success([
            'student' => $student,
            'fees' => $allFees
        ], 'Student fees retrieved successfully');
    }

    /**
     * Collect fee payment.
     */
    public function collectFee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_fee_master_id' => 'nullable|exists:student_fee_masters,id',
            'student_transport_fee_id' => 'nullable|exists:student_transport_fees,id',
            'amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'fine' => 'nullable|numeric|min:0',
            'payment_mode' => 'required|string',
            'note' => 'nullable|string',
            'date' => 'required|date',
        ]);

        if (empty($request->student_fee_master_id) && empty($request->student_transport_fee_id)) {
            return $this->error('Please provide a fee to collect', 422);
        }

        $validated['collected_by'] = $request->user()->id;

        $payment = FeePayment::create($validated);

        if ($request->student_transport_fee_id) {
            $tFee = \App\Models\StudentTransportFee::with('payments')->find($request->student_transport_fee_id);
            if ($tFee) {
                $paid = $tFee->payments->sum('amount');
                if ($paid >= $tFee->amount) {
                    $tFee->update(['status' => 'paid']);
                }
            }
        }

        $payment->load('studentFeeMaster.student.schoolClass', 'studentFeeMaster.student.section', 'studentTransportFee.student.schoolClass', 'studentTransportFee.student.section');

        $student = $payment->studentFeeMaster?->student ?? $payment->studentTransportFee?->student;
        if ($student) {
            NotificationDispatcher::dispatch('Fee Processing', [
                'fee_amount' => (string)($payment->amount ?? '0'),
                'student_name' => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'class' => $student->schoolClass->name ?? '',
                'section' => $student->section->name ?? '',
                'email' => $student->email ?? '',
                'contact_no' => $student->phone ?? '',
                'transaction_id' => (string)$payment->id,
            ], [
                'student_id' => $student->id,
                'guardian_id' => $student->id,
                'email' => $student->email ?? '',
            ]);
        }

        return $this->success($payment, 'Fee collected successfully', 201);
    }

    /**
     * Search fee payments by Payment ID or other criteria.
     */
    public function searchPayments(Request $request): JsonResponse
    {
        $query = FeePayment::with([
            'studentFeeMaster.student.schoolClass',
            'studentFeeMaster.student.section',
            'studentFeeMaster.feeMaster.feeType',
            'collectedBy'
        ]);

        if ($request->filled('payment_id')) {
            $query->where('id', $request->payment_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('studentFeeMaster.student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_no', 'like', "%{$search}%");
            });
        }

        $payments = $query->latest()->get();

        return $this->success($payments, 'Fee payments retrieved successfully');
    }

    /**
     * Assign manual fee.
     */
    public function assignManualFee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
            'fee_master_id' => 'nullable',
            'transport_fee_master_id' => 'nullable'
        ]);

        if (empty($request->fee_master_id) && empty($request->transport_fee_master_id)) {
            return $this->error('Please select at least one fee to assign', 422);
        }

        $student = User::find($request->student_id);
        $activeSessionId = \App\Models\AcademicSession::where('is_active', true)->value('id') ?? $student->academic_session_id;

        $results = [];

        if ($request->fee_master_id) {
            $exists = StudentFeeMaster::where('student_id', $request->student_id)
                ->where('fee_master_id', $request->fee_master_id)
                ->first();

            if (!$exists) {
                $fee = StudentFeeMaster::create([
                    'student_id' => $request->student_id,
                    'fee_master_id' => $request->fee_master_id,
                    'academic_session_id' => $activeSessionId,
                    'is_active' => true,
                ]);
                $results['regular'] = $fee;
            }
        }

        if ($request->transport_fee_master_id) {
            $exists = \App\Models\StudentTransportFee::where('student_id', $request->student_id)
                ->where('transport_fee_master_id', $request->transport_fee_master_id)
                ->first();

            if (!$exists) {
                $assignment = \App\Models\StudentTransportAssignment::where('student_id', $request->student_id)->first();
                if (!$assignment) {
                    return $this->error('Student does not have a transport assignment. Please assign transport first.', 422);
                }

                $routePickupPoint = \App\Models\TransportRoutePickupPoint::where('route_id', $assignment->route_id)
                    ->where('pickup_point_id', $assignment->pickup_point_id)
                    ->first();

                if (!$routePickupPoint) {
                    return $this->error('Invalid route and pickup point combination on student transport assignment.', 422);
                }

                $amount = $routePickupPoint->monthly_fees;

                $tFee = \App\Models\StudentTransportFee::create([
                    'student_id' => $request->student_id,
                    'transport_fee_master_id' => $request->transport_fee_master_id,
                    'academic_session_id' => $activeSessionId,
                    'amount' => $amount,
                    'status' => 'unpaid'
                ]);
                $results['transport'] = $tFee;
            }
        }

        return $this->success($results, 'Invoice(s) generated successfully', 201);
    }

    /**
     * Delete student fee entry.
     */
    public function deleteStudentFee(Request $request, $id): JsonResponse
    {
        $isTransport = $request->boolean('is_transport');
        if ($isTransport) {
            $fee = \App\Models\StudentTransportFee::find($id);
            if ($fee) {
                $fee->payments()->delete();
                $fee->delete();
                return $this->success(null, 'Transport fee deleted successfully');
            }
        } else {
            $fee = StudentFeeMaster::find($id);
            if ($fee) {
                $fee->payments()->delete();
                $fee->delete();
                return $this->success(null, 'Fee record deleted successfully');
            }
        }
        return $this->error('Fee record not found', 404);
    }

    /**
     * Update student fee status (Mark as Paid / Unpaid) or amount / due date.
     */
    public function updateStudentFee(Request $request, $id): JsonResponse
    {
        $isTransport = $request->boolean('is_transport');
        $status = $request->input('status'); // 'paid', 'unpaid'
        $amount = $request->input('amount');
        $dueDate = $request->input('due_date');

        if ($isTransport) {
            $fee = \App\Models\StudentTransportFee::with('payments')->find($id);
            if (!$fee) return $this->error('Transport fee not found', 404);

            if ($amount !== null) {
                $fee->amount = (float) $amount;
            }
            if ($status === 'paid') {
                $paid = $fee->payments->sum('amount');
                $due = $fee->amount - $paid;
                if ($due > 0) {
                    FeePayment::create([
                        'student_transport_fee_id' => $fee->id,
                        'amount' => $due,
                        'payment_mode' => 'Cash',
                        'date' => now()->format('Y-m-d'),
                        'collected_by' => $request->user()->id ?? 1,
                        'note' => 'Marked as paid',
                    ]);
                }
                $fee->status = 'paid';
            } elseif ($status === 'unpaid') {
                $fee->payments()->delete();
                $fee->status = 'unpaid';
            }
            $fee->save();
            return $this->success($fee, 'Transport fee updated successfully');
        } else {
            $fee = StudentFeeMaster::with(['feeMaster', 'payments'])->find($id);
            if (!$fee) return $this->error('Student fee not found', 404);

            if ($amount !== null && $fee->feeMaster) {
                $fee->feeMaster->update(['amount' => (float) $amount]);
            }
            if ($dueDate !== null && $fee->feeMaster) {
                $fee->feeMaster->update(['due_date' => $dueDate]);
            }
            if ($status === 'paid') {
                $total = (float) ($fee->feeMaster->amount ?? 0);
                $paid = $fee->payments->sum('amount');
                $due = $total - $paid;
                if ($due > 0) {
                    FeePayment::create([
                        'student_fee_master_id' => $fee->id,
                        'amount' => $due,
                        'payment_mode' => 'Cash',
                        'date' => now()->format('Y-m-d'),
                        'collected_by' => $request->user()->id ?? 1,
                        'note' => 'Marked as paid',
                    ]);
                }
            } elseif ($status === 'unpaid') {
                $fee->payments()->delete();
            }
            $fee->save();
            return $this->success($fee, 'Student fee updated successfully');
        }
    }

    /**
     * Generate manual invoice with custom description rows, qty, amounts, and discount.
     */
    public function generateManualInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'due_date' => 'nullable|date',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.amount' => 'required|numeric|min:0',
        ]);

        $activeSessionId = \App\Models\AcademicSession::where('is_active', true)->value('id') ?? 1;
        $discount = (float) ($request->input('discount', 0));

        $feeGroup = FeeGroup::firstOrCreate(
            ['name' => 'Manual Invoices'],
            ['description' => 'Custom invoices generated manually by accountant']
        );

        $createdFees = [];

        foreach ($request->items as $idx => $item) {
            $qty = (float) ($item['qty'] ?? 1);
            $unitAmount = (float) ($item['amount'] ?? 0);
            $totalAmount = $qty * $unitAmount;
            // Apply discount to first item or total
            $itemDiscount = ($idx === 0) ? $discount : 0;
            $netAmount = max(0, $totalAmount - $itemDiscount);

            $description = trim($item['description']);
            $typeName = $qty > 1 ? "{$description} (Qty: {$qty})" : $description;

            $feeType = FeeType::firstOrCreate(
                ['name' => $typeName],
                [
                    'code' => 'MANUAL',
                    'description' => $description,
                ]
            );

            $feeMaster = FeeMaster::create([
                'fee_group_id' => $feeGroup->id,
                'fee_type_id' => $feeType->id,
                'due_date' => $request->due_date ?? now()->addDays(15)->format('Y-m-d'),
                'amount' => $netAmount,
                'fine_amount' => 0,
                'session_id' => $activeSessionId,
            ]);

            $studentFee = StudentFeeMaster::create([
                'student_id' => $request->student_id,
                'fee_master_id' => $feeMaster->id,
                'academic_session_id' => $activeSessionId,
                'is_active' => true,
            ]);

            $createdFees[] = $studentFee;
        }

        return $this->success($createdFees, 'Manual invoice generated successfully', 201);
    }

    /**
     * Get single manual invoice item details for editing.
     */
    public function getManualInvoiceDetails($id): JsonResponse
    {
        $studentFee = StudentFeeMaster::with(['feeMaster.feeType', 'student.schoolClass', 'student.section'])->find($id);
        if (!$studentFee) return $this->error('Invoice fee not found', 404);

        return $this->success([
            'id' => $studentFee->id,
            'student_id' => $studentFee->student_id,
            'student' => $studentFee->student,
            'fee_master' => $studentFee->feeMaster,
            'amount' => $studentFee->feeMaster?->amount ?? 0,
            'due_date' => $studentFee->feeMaster?->due_date,
            'description' => $studentFee->feeMaster?->feeType?->name ?? 'Tuition Fee',
        ]);
    }

    /**
     * Update manual invoice item.
     */
    public function updateManualInvoice(Request $request, $id): JsonResponse
    {
        $studentFee = StudentFeeMaster::with('feeMaster.feeType')->find($id);
        if (!$studentFee) return $this->error('Invoice fee not found', 404);

        $request->validate([
            'due_date' => 'nullable|date',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.amount' => 'required|numeric|min:0',
        ]);

        $discount = (float) ($request->input('discount', 0));
        $firstItem = $request->items[0];
        $qty = (float) ($firstItem['qty'] ?? 1);
        $unitAmount = (float) ($firstItem['amount'] ?? 0);
        $totalAmount = $qty * $unitAmount;
        $netAmount = max(0, $totalAmount - $discount);

        $description = trim($firstItem['description']);
        $typeName = $qty > 1 ? "{$description} (Qty: {$qty})" : $description;

        if ($studentFee->feeMaster) {
            $studentFee->feeMaster->update([
                'amount' => $netAmount,
                'due_date' => $request->due_date ?? $studentFee->feeMaster->due_date,
            ]);

            if ($studentFee->feeMaster->feeType) {
                $studentFee->feeMaster->feeType->update([
                    'name' => $typeName,
                    'description' => $description,
                ]);
            }
        }

        return $this->success($studentFee, 'Invoice updated successfully');
    }
}
