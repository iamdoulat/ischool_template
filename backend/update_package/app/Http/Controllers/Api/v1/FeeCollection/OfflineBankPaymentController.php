<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Api\BaseController;
use App\Models\OfflineBankPayment;
use App\Models\FeePayment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class OfflineBankPaymentController extends BaseController
{
    /**
     * Display a listing of offline bank payments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OfflineBankPayment::with(['student.schoolClass', 'student.section', 'studentFeeMaster.feeMaster.feeType', 'course'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $payments = $query->get();

        return $this->success($payments, 'Offline bank payments retrieved successfully');
    }

    /**
     * Approve an offline bank payment.
     */
    public function approve(Request $request, OfflineBankPayment $offlineBankPayment): JsonResponse
    {
        if ($offlineBankPayment->status !== 'pending') {
            return $this->error('Only pending payments can be approved.', 400);
        }

        DB::beginTransaction();
        try {
            // Update offline payment status
            $offlineBankPayment->update([
                'status' => 'approved',
                'status_date' => now(),
                'action_by' => Auth::id(),
            ]);

            // Create real FeePayment record if student_fee_master_id is set
            if ($offlineBankPayment->student_fee_master_id) {
                \App\Models\FeePayment::create([
                    'student_fee_master_id' => $offlineBankPayment->student_fee_master_id,
                    'collected_by' => Auth::id(),
                    'amount' => $offlineBankPayment->amount,
                    'payment_mode' => 'Bank Transfer',
                    'note' => 'Approved from offline bank payment. Ref: ' . $offlineBankPayment->reference_no,
                    'date' => $offlineBankPayment->payment_date,
                ]);
            } elseif ($offlineBankPayment->course_id) {
                $purchase = \App\Models\OnlineCoursePurchase::where('student_id', $offlineBankPayment->student_id)
                    ->where('course_id', $offlineBankPayment->course_id)
                    ->first();

                if ($purchase) {
                    $incomeHead = \App\Models\IncomeHead::firstOrCreate(
                        ['income_head' => 'Online Course Fees'],
                        ['description' => 'Fees collected from offline online course purchases', 'is_active' => 1]
                    );
                    $income = \App\Models\Income::create([
                        'income_head_id' => $incomeHead->id,
                        'name' => 'Course Purchase: ' . ($offlineBankPayment->course->title ?? 'Course') . ' (' . ($offlineBankPayment->student->name ?? 'Student') . ')',
                        'invoice_number' => $purchase->invoice_no,
                        'date' => date('Y-m-d'),
                        'amount' => $offlineBankPayment->amount,
                        'description' => 'Offline payment for online course',
                    ]);
                    $purchase->update([
                        'status' => 'Completed',
                        'income_id' => $income->id,
                    ]);
                }
            }

            DB::commit();
            return $this->success($offlineBankPayment, 'Payment approved and applied successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to approve payment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject an offline bank payment.
     */
    public function reject(Request $request, OfflineBankPayment $offlineBankPayment): JsonResponse
    {
        if ($offlineBankPayment->status !== 'pending') {
            return $this->error('Only pending payments can be rejected.', 400);
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $offlineBankPayment->update([
            'status' => 'rejected',
            'status_date' => now(),
            'action_by' => Auth::id(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        if ($offlineBankPayment->course_id) {
            $purchase = \App\Models\OnlineCoursePurchase::where('student_id', $offlineBankPayment->student_id)
                ->where('course_id', $offlineBankPayment->course_id)
                ->first();
            if ($purchase) {
                $purchase->update(['status' => 'Rejected']);
            }
        }

        return $this->success($offlineBankPayment, 'Payment rejected successfully');
    }

    /**
     * Delete an offline bank payment record.
     */
    public function destroy(OfflineBankPayment $offlineBankPayment): JsonResponse
    {
        $offlineBankPayment->delete();
        return $this->success(null, 'Offline bank payment record deleted successfully');
    }
}
