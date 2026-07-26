<?php

namespace App\Http\Controllers\Api\v1\MultiBranch;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\FeePayment;
use App\Models\GeneralSetting;
use App\Models\Income;
use App\Models\StaffPayroll;
use App\Models\UserLog;
use Illuminate\Http\Request;

/**
 * Real cross-branch report data for the CURRENT branch (this database).
 * Returns { data: [{id, branch, name, invoice, head, date, amount}], total, grand_total }.
 */
class MultiBranchReportController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->get('type', 'expense');
        $search = trim((string) $request->get('search', ''));
        $branch = GeneralSetting::first()->school_name ?? 'Home Branch';

        $data = $this->safe(fn () => match ($type) {
            'expense' => $this->expenses($branch),
            'income' => $this->incomes($branch),
            'payroll' => $this->payroll($branch),
            'daily' => $this->dailyCollection($branch),
            'userlog' => $this->userLogs($branch),
            default => [],
        }, []);

        // In-memory search across the mapped record fields.
        if ($search !== '') {
            $needle = mb_strtolower($search);
            $data = array_values(array_filter($data, function ($row) use ($needle) {
                foreach (['branch', 'name', 'invoice', 'head'] as $key) {
                    if (mb_stripos((string) ($row[$key] ?? ''), $needle) !== false) {
                        return true;
                    }
                }
                return false;
            }));
        }

        return response()->json([
            'data' => $data,
            'total' => count($data),
            'grand_total' => array_sum(array_column($data, 'amount')),
        ]);
    }

    private function expenses(string $branch): array
    {
        return Expense::with('expenseHead')->orderByDesc('date')->limit(500)->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'branch' => $branch,
                'name' => $e->name,
                'invoice' => $e->invoice_number ?? '-',
                'head' => $e->expenseHead->expense_head ?? '-',
                'date' => $this->fmtDate($e->date),
                'amount' => (float) $e->amount,
            ])->values()->all();
    }

    private function incomes(string $branch): array
    {
        return Income::with('incomeHead')->orderByDesc('date')->limit(500)->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'branch' => $branch,
                'name' => $e->name,
                'invoice' => $e->invoice_number ?? '-',
                'head' => $e->incomeHead->income_head ?? '-',
                'date' => $this->fmtDate($e->date),
                'amount' => (float) $e->amount,
            ])->values()->all();
    }

    private function payroll(string $branch): array
    {
        return StaffPayroll::with('staff')->where('status', 'Paid')->orderByDesc('paid_on')->limit(500)->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'branch' => $branch,
                'name' => $p->staff->name ?? 'Staff #' . $p->user_id,
                'invoice' => 'PAY-' . $p->id,
                'head' => $p->staff->role ?? 'Payroll',
                'date' => $this->fmtDate($p->paid_on),
                'amount' => (float) $p->net_salary,
            ])->values()->all();
    }

    private function dailyCollection(string $branch): array
    {
        return FeePayment::with(['studentFeeMaster.student', 'studentFeeMaster.feeMaster.feeType'])
            ->orderByDesc('date')->limit(500)->get()
            ->map(function ($p) use ($branch) {
                $student = $p->studentFeeMaster->student ?? null;
                $name = $student
                    ? trim(($student->name ?? '') . ' ' . ($student->last_name ?? ''))
                    : 'Student';
                $feeType = $p->studentFeeMaster->feeMaster->feeType ?? null;
                return [
                    'id' => $p->id,
                    'branch' => $branch,
                    'name' => $name !== '' ? $name : 'Student',
                    'invoice' => 'RCPT-' . $p->id,
                    'head' => is_object($feeType) ? ($feeType->name ?? $feeType->type ?? 'Fees') : ($feeType ?? 'Fees'),
                    'date' => $this->fmtDate($p->date),
                    'amount' => (float) $p->amount,
                ];
            })->values()->all();
    }

    private function userLogs(string $branch): array
    {
        return UserLog::orderByDesc('id')->limit(500)->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'branch' => $branch,
                'name' => $l->username ?? '-',
                'invoice' => '#' . $l->id,
                'head' => $l->role ?? '-',
                'date' => $this->fmtDate($l->created_at),
                'amount' => 0,
            ])->values()->all();
    }

    private function fmtDate($date): string
    {
        if (empty($date)) {
            return '-';
        }
        try {
            return \Illuminate\Support\Carbon::parse($date)->format('m/d/Y');
        } catch (\Throwable $e) {
            return (string) $date;
        }
    }

    private function safe(callable $fn, $fallback)
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            return $fallback;
        }
    }
}
