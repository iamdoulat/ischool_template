<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Api\BaseController;
use App\Models\FeeReminder;
use App\Models\FeeMaster;
use App\Models\StudentFeeMaster;
use App\Models\FeePayment;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FeeReminderController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $reminders = FeeReminder::all();
        return $this->success($reminders, 'Fee reminders retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FeeReminder $fee_reminder): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        $fee_reminder->update($request->only(['days', 'is_active']));

        return $this->success($fee_reminder, 'Fee reminder updated successfully');
    }

    /**
     * Bulk update fee reminders.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'reminders' => 'required|array',
            'reminders.*.id' => 'required|exists:fee_reminders,id',
            'reminders.*.days' => 'required|integer|min:0',
            'reminders.*.is_active' => 'required|boolean',
        ]);

        foreach ($request->reminders as $reminderData) {
            $reminder = FeeReminder::find($reminderData['id']);
            if ($reminder) {
                $reminder->update([
                    'days' => $reminderData['days'],
                    'is_active' => $reminderData['is_active'],
                ]);
            }
        }

        return $this->success(null, 'Fee reminders updated successfully');
    }

    /**
     * Send fee reminder notifications based on active reminder configurations.
     *
     * For "Before" reminders: finds students whose fee due_date is X days from now.
     * For "After" reminders: finds students whose fee due_date was X days ago and is still unpaid.
     */
    public function sendReminders(): JsonResponse
    {
        $activeReminders = FeeReminder::where('is_active', true)->get();

        if ($activeReminders->isEmpty()) {
            return $this->success([
                'total_notifications' => 0,
                'before_reminders' => 0,
                'after_reminders' => 0,
                'students_notified' => 0,
            ], 'No active reminders configured');
        }

        $today = Carbon::today();
        $totalNotifications = 0;
        $beforeCount = 0;
        $afterCount = 0;
        $notifiedStudentIds = [];

        foreach ($activeReminders as $reminder) {
            if ($reminder->days <= 0) continue;

            if ($reminder->type === 'Before') {
                // Find fees with due_date = today + X days (upcoming)
                $targetDate = $today->copy()->addDays($reminder->days);
                $feeMasters = FeeMaster::whereDate('due_date', $targetDate->toDateString())->get();
            } else {
                // "After" — find fees with due_date = today - X days (overdue)
                $targetDate = $today->copy()->subDays($reminder->days);
                $feeMasters = FeeMaster::whereDate('due_date', $targetDate->toDateString())->get();
            }

            if ($feeMasters->isEmpty()) continue;

            $feeMasterIds = $feeMasters->pluck('id');

            // Get student fee assignments for these fee masters
            $studentFees = StudentFeeMaster::with([
                'student.schoolClass',
                'student.section',
                'feeMaster.feeType',
                'feeMaster.feeGroup',
                'payments',
            ])
                ->whereIn('fee_master_id', $feeMasterIds)
                ->where('is_active', true)
                ->get();

            foreach ($studentFees as $studentFee) {
                $student = $studentFee->student;
                if (!$student) continue;

                $feeMaster = $studentFee->feeMaster;
                if (!$feeMaster) continue;

                // For "After" reminders, only notify if fee is still unpaid/partially paid
                if ($reminder->type === 'After') {
                    $totalPaid = $studentFee->payments->sum('amount');
                    $totalDiscount = $studentFee->payments->sum('discount');
                    $feeAmount = (float) $feeMaster->amount;
                    if (($totalPaid + $totalDiscount) >= $feeAmount) {
                        continue; // Already fully paid, skip
                    }
                }

                $feeAmount = $feeMaster->amount ?? 0;
                $feeTypeName = $feeMaster->feeType->name ?? 'N/A';
                $feeGroupName = $feeMaster->feeGroup->name ?? 'N/A';
                $studentName = trim(($student->name ?? '') . ' ' . ($student->last_name ?? ''));
                $dueDate = $feeMaster->due_date ? Carbon::parse($feeMaster->due_date)->format('d M Y') : 'N/A';

                try {
                    NotificationDispatcher::dispatch('Fees Reminder', [
                        'fee_amount' => (string) $feeAmount,
                        'student_name' => $studentName,
                        'admission_no' => $student->admission_no ?? '',
                        'due_date' => $dueDate,
                        'fee_type' => $feeTypeName,
                        'fee_group' => $feeGroupName,
                        'class' => $student->schoolClass->name ?? '',
                        'section' => $student->section->name ?? '',
                        'reminder_type' => $reminder->type,
                        'days' => (string) $reminder->days,
                        'email' => $student->email ?? '',
                        'contact_no' => $student->phone ?? '',
                    ], [
                        'student_id' => $student->id,
                        'guardian_id' => $student->id,
                        'email' => $student->email ?? '',
                        'phone' => $student->phone ?? '',
                    ]);

                    $totalNotifications++;
                    $notifiedStudentIds[] = $student->id;

                    if ($reminder->type === 'Before') {
                        $beforeCount++;
                    } else {
                        $afterCount++;
                    }
                } catch (\Exception $e) {
                    Log::error("Fee reminder notification failed for student {$student->id}: " . $e->getMessage());
                }
            }
        }

        $uniqueStudents = count(array_unique($notifiedStudentIds));

        Log::info("Fee Reminders Sent: total={$totalNotifications}, before={$beforeCount}, after={$afterCount}, students={$uniqueStudents}");

        return $this->success([
            'total_notifications' => $totalNotifications,
            'before_reminders' => $beforeCount,
            'after_reminders' => $afterCount,
            'students_notified' => $uniqueStudents,
        ], 'Fee reminder notifications sent successfully');
    }
}
