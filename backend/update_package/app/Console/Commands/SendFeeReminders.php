<?php

namespace App\Console\Commands;

use App\Models\FeeReminder;
use App\Models\FeeMaster;
use App\Models\StudentFeeMaster;
use App\Services\NotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendFeeReminders extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'fees:send-reminders';

    /**
     * The console command description.
     */
    protected $description = 'Send automated fee reminder notifications based on configured reminder settings';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $activeReminders = FeeReminder::where('is_active', true)->get();

        if ($activeReminders->isEmpty()) {
            $this->info('No active fee reminders configured.');
            return self::SUCCESS;
        }

        $today = Carbon::today();
        $totalNotifications = 0;
        $beforeCount = 0;
        $afterCount = 0;

        foreach ($activeReminders as $reminder) {
            if ($reminder->days <= 0) continue;

            if ($reminder->type === 'Before') {
                $targetDate = $today->copy()->addDays($reminder->days);
            } else {
                $targetDate = $today->copy()->subDays($reminder->days);
            }

            $feeMasters = FeeMaster::whereDate('due_date', $targetDate->toDateString())->get();

            if ($feeMasters->isEmpty()) {
                $this->line("  [{$reminder->type} {$reminder->days}d] No fees due on {$targetDate->toDateString()}");
                continue;
            }

            $feeMasterIds = $feeMasters->pluck('id');

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

            $sent = 0;

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
                        continue;
                    }
                }

                $studentName = trim(($student->name ?? '') . ' ' . ($student->last_name ?? ''));
                $dueDate = $feeMaster->due_date ? Carbon::parse($feeMaster->due_date)->format('d M Y') : 'N/A';

                try {
                    NotificationDispatcher::dispatch('Fees Reminder', [
                        'fee_amount' => (string) ($feeMaster->amount ?? 0),
                        'student_name' => $studentName,
                        'admission_no' => $student->admission_no ?? '',
                        'due_date' => $dueDate,
                        'fee_type' => $feeMaster->feeType->name ?? 'N/A',
                        'fee_group' => $feeMaster->feeGroup->name ?? 'N/A',
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

                    $sent++;
                    $totalNotifications++;

                    if ($reminder->type === 'Before') {
                        $beforeCount++;
                    } else {
                        $afterCount++;
                    }
                } catch (\Exception $e) {
                    $this->error("  Failed for student {$student->id}: " . $e->getMessage());
                    Log::error("Fee reminder failed for student {$student->id}: " . $e->getMessage());
                }
            }

            $this->info("  [{$reminder->type} {$reminder->days}d] Sent {$sent} notification(s)");
        }

        $this->newLine();
        $this->info("Total: {$totalNotifications} notifications (Before: {$beforeCount}, After: {$afterCount})");

        Log::info("Fee Reminders Command: total={$totalNotifications}, before={$beforeCount}, after={$afterCount}");

        return self::SUCCESS;
    }
}
