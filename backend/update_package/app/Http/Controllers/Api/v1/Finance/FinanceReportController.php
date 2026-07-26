<?php

namespace App\Http\Controllers\Api\v1\Finance;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\FeePayment;
use App\Models\StudentFeeMaster;
use App\Models\Income;
use App\Models\IncomeHead;
use App\Models\Expense;
use App\Models\ExpenseHead;
use App\Models\StaffPayroll;
use App\Models\OnlineAdmission;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceReportController extends Controller
{
    use ApiResponse;

    /**
     * Get balance fees statement report.
     */
    public function balanceFeesStatement(Request $request): JsonResponse
    {
        $classId = $request->get('school_class_id');
        $sectionId = $request->get('section_id');
        $feeGroupId = $request->get('fee_group_id');

        $query = User::where('role', 'Student')
            ->with(['schoolClass', 'section']);

        if ($classId && $classId !== 'all') {
            $query->where('school_class_id', $classId);
        }

        if ($sectionId && $sectionId !== 'all') {
            $query->where('section_id', $sectionId);
        }

        $students = $query->get();
        $reportData = [];

        foreach ($students as $student) {
            $feeMastersQuery = StudentFeeMaster::where('student_id', $student->id)
                ->with(['feeMaster.feeGroup', 'feeMaster.feeType', 'payments']);

            if ($feeGroupId && $feeGroupId !== 'all') {
                $feeMastersQuery->whereHas('feeMaster', function ($q) use ($feeGroupId) {
                    $q->where('fee_group_id', $feeGroupId);
                });
            }

            $feeMasters = $feeMastersQuery->get();

            $fees = [];
            $totalAmount = 0;
            $totalDiscount = 0;
            $totalFine = 0;
            $totalPaid = 0;
            $totalBalance = 0;

            foreach ($feeMasters as $master) {
                $masterPaid = $master->payments->sum('amount');
                $masterDiscount = $master->payments->sum('discount');
                $masterFine = $master->payments->sum('fine');
                
                $amount = $master->feeMaster->amount;
                $balance = $amount - $masterPaid - $masterDiscount + $masterFine;
                
                $status = 'Unpaid';
                if ($masterPaid + $masterDiscount >= $amount) {
                    $status = 'Paid';
                } elseif ($masterPaid > 0 || $masterDiscount > 0) {
                    $status = 'Partial';
                }

                $lastPayment = $master->payments->last();

                $fees[] = [
                    'group' => $master->feeMaster->feeGroup->name ?? 'N/A',
                    'code' => $master->feeMaster->feeType->code ?? 'N/A',
                    'dueDate' => $master->feeMaster->due_date ? Carbon::parse($master->feeMaster->due_date)->format('m/d/Y') : 'N/A',
                    'status' => $status,
                    'amount' => number_format($amount, 2, '.', ''),
                    'paymentId' => $lastPayment ? ($lastPayment->id . '/1') : '0.00',
                    'mode' => $lastPayment ? $lastPayment->payment_mode : '',
                    'date' => ($lastPayment && $lastPayment->date) ? Carbon::parse($lastPayment->date)->format('m/d/Y') : '',
                    'discount' => number_format($masterDiscount, 2, '.', ''),
                    'fine' => number_format($masterFine, 2, '.', ''),
                    'paid' => number_format($masterPaid, 2, '.', ''),
                    'balance' => number_format(max(0, $balance), 2, '.', '')
                ];

                $totalAmount += $amount;
                $totalDiscount += $masterDiscount;
                $totalFine += $masterFine;
                $totalPaid += $masterPaid;
                $totalBalance += max(0, $balance);
            }

            if (count($fees) > 0) {
                $reportData[] = [
                    'admissionNo' => $student->admission_no,
                    'name' => "{$student->name} {$student->last_name}",
                    'fatherName' => $student->father_name ?? 'N/A',
                    'classSection' => ($student->schoolClass && $student->section) ? "{$student->schoolClass->name} ({$student->section->name})" : 'N/A',
                    'fees' => $fees,
                    'totalAmount' => number_format($totalAmount, 2, '.', ''),
                    'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
                    'totalFine' => number_format($totalFine, 2, '.', ''),
                    'totalPaid' => number_format($totalPaid, 2, '.', ''),
                    'totalBalance' => number_format($totalBalance, 2, '.', ''),
                ];
            }
        }

        return $this->success($reportData, 'Balance fees statement retrieved successfully');
    }

    /**
     * Get fees collection report (transaction level).
     */
    public function feesCollectionReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_duration', 'today');
        $classId = $request->get('school_class_id');
        $sectionId = $request->get('section_id');
        $feeTypeId = $request->get('fee_type_id');
        $collectBy = $request->get('collect_by');

        $query = FeePayment::with(['studentFeeMaster.student.schoolClass', 'studentFeeMaster.feeMaster.feeGroup', 'studentFeeMaster.feeMaster.feeType', 'collectedBy']);

        // Date duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('date', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('date', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('date', Carbon::now()->month)->whereYear('date', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('date', Carbon::now()->subMonth()->month)->whereYear('date', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('date', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('date', Carbon::now()->subYear()->year);
                break;
        }

        // Other filters
        if ($classId && $classId !== 'all') {
            $query->whereHas('studentFeeMaster.student', function($q) use ($classId) {
                $q->where('school_class_id', $classId);
            });
        }
        if ($sectionId && $sectionId !== 'all') {
            $query->whereHas('studentFeeMaster.student', function($q) use ($sectionId) {
                $q->where('section_id', $sectionId);
            });
        }
        if ($feeTypeId && $feeTypeId !== 'all') {
            $query->whereHas('studentFeeMaster.feeMaster', function($q) use ($feeTypeId) {
                $q->where('fee_type_id', $feeTypeId);
            });
        }
        if ($collectBy && $collectBy !== 'all') {
            $query->where('collected_by', $collectBy);
        }

        $payments = $query->orderBy('date', 'desc')->get();
        
        $reportData = $payments->map(function ($payment) {
            return [
                'payment_id' => $payment->id . '/1',
                'date' => Carbon::parse($payment->date)->format('m/d/Y'),
                'student_name' => ($payment->studentFeeMaster->student->name ?? 'N/A') . ' ' . ($payment->studentFeeMaster->student->last_name ?? ''),
                'class' => $payment->studentFeeMaster->student->schoolClass->name ?? 'N/A',
                'fees_group' => $payment->studentFeeMaster->feeMaster->feeGroup->name ?? 'N/A',
                'fees_type' => $payment->studentFeeMaster->feeMaster->feeType->name ?? 'N/A',
                'mode' => $payment->payment_mode ?? 'N/A',
                'amount' => number_format($payment->amount, 2, '.', ''),
                'discount' => number_format($payment->discount, 2, '.', ''),
                'fine' => number_format($payment->fine, 2, '.', ''),
                'total' => number_format($payment->amount + $payment->fine, 2, '.', ''),
                'collected_by' => $payment->collectedBy->name ?? 'Admin',
            ];
        });

        return $this->success($reportData, 'Fees collection report retrieved successfully');
    }

    /**
     * Get filters for fees collection report.
     */
    public function getCollectionFilters(): JsonResponse
    {
        $feeTypes = \App\Models\FeeType::all();
        $collectors = User::whereIn('role', ['Admin', 'Accountant', 'Super Admin'])->get();

        return $this->success([
            'fee_types' => $feeTypes,
            'collectors' => $collectors
        ], 'Collection filters retrieved successfully');
    }

    /**
     * Get balance fees report (summarized per student).
     */
    public function balanceFeesReport(Request $request): JsonResponse
    {
        $classId = $request->get('school_class_id');
        $sectionId = $request->get('section_id');
        $searchType = $request->get('search_type', 'all');

        $query = User::where('role', 'Student')
            ->with(['schoolClass', 'section']);

        if ($classId && $classId !== 'all') {
            $query->where('school_class_id', $classId);
        }

        if ($sectionId && $sectionId !== 'all') {
            $query->where('section_id', $sectionId);
        }

        $students = $query->get();
        $reportData = [];

        foreach ($students as $student) {
            $feeMasters = StudentFeeMaster::where('student_id', $student->id)
                ->with(['feeMaster'])
                ->get();

            $totalFees = 0;
            $totalPaid = 0;
            $totalDiscount = 0;
            $totalFine = 0;

            foreach ($feeMasters as $master) {
                $payments = DB::table('fee_payments')
                    ->where('student_fee_master_id', $master->id)
                    ->get();

                $totalFees += $master->feeMaster->amount;
                $totalPaid += $payments->sum('amount');
                $totalDiscount += $payments->sum('discount');
                $totalFine += $payments->sum('fine');
            }

            $balance = $totalFees - $totalPaid - $totalDiscount + $totalFine;

            // Filter by search type if needed (e.g. only those with balance)
            if ($searchType === 'balance' && $balance <= 0) {
                continue;
            }

            $reportData[] = [
                'student_name' => "{$student->name} {$student->last_name}",
                'class' => ($student->schoolClass && $student->section) ? "{$student->schoolClass->name} ({$student->section->name})" : 'N/A',
                'mobile_no' => $student->phone ?? 'N/A',
                'admission_no' => $student->admission_no,
                'roll_number' => $student->roll_no ?? 'N/A',
                'father_name' => $student->father_name ?? 'N/A',
                'total_fees' => number_format($totalFees, 2, '.', ''),
                'paid_fees' => number_format($totalPaid, 2, '.', ''),
                'discount' => number_format($totalDiscount, 2, '.', ''),
                'fine' => number_format($totalFine, 2, '.', ''),
                'balance' => number_format(max(0, $balance), 2, '.', ''),
            ];
        }

        return $this->success($reportData, 'Balance fees report retrieved successfully');
    }

    /**
     * Get income report.
     */
    public function incomeReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_type', 'today');

        $query = Income::with('incomeHead');

        // Date duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('date', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('date', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('date', Carbon::now()->month)->whereYear('date', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('date', Carbon::now()->subMonth()->month)->whereYear('date', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('date', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('date', Carbon::now()->subYear()->year);
                break;
        }

        $incomes = $query->orderBy('date', 'desc')->get();
        
        $reportData = $incomes->map(function ($income) {
            return [
                'name' => $income->name ?? 'N/A',
                'invoice_number' => $income->invoice_number ?? 'N/A',
                'income_head' => $income->incomeHead->name ?? 'N/A',
                'date' => Carbon::parse($income->date)->format('m/d/Y'),
                'amount' => number_format($income->amount, 2, '.', ''),
            ];
        });

        return $this->success($reportData, 'Income report retrieved successfully');
    }

    /**
     * Get payroll report.
     */
    public function payrollReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_type', 'today');

        $query = StaffPayroll::with('staff')
            ->join('users', 'staff_payrolls.user_id', '=', 'users.id');

        // Apply duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('staff_payrolls.created_at', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('staff_payrolls.created_at', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('staff_payrolls.created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('staff_payrolls.created_at', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('staff_payrolls.created_at', Carbon::now()->month)
                    ->whereYear('staff_payrolls.created_at', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('staff_payrolls.created_at', Carbon::now()->subMonth()->month)
                    ->whereYear('staff_payrolls.created_at', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('staff_payrolls.created_at', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('staff_payrolls.created_at', Carbon::now()->subYear()->year);
                break;
        }

        $reportData = $query->select('staff_payrolls.*')
            ->get()
            ->map(function ($item) {
                $basic = (float)$item->basic_salary;
                $earning = (float)$item->allowances;
                $deduction = (float)$item->deductions;
                $tax = 0; // Assuming 0 for now as not in DB
                
                // Gross = Basic + Earning - Deduction (Following screenshot logic)
                $gross = $basic + $earning - $deduction;
                // Net = Gross - Tax
                $net = $gross - $tax;

                return [
                    'name' => ($item->staff->name ?? 'Unknown') . ' (' . ($item->staff->staff_id ?? 'N/A') . ')',
                    'role' => $item->staff->role ?? 'N/A',
                    'designation' => $item->staff->designation ?? 'N/A',
                    'month_year' => $item->month . ' ' . $item->year,
                    'payslip_no' => $item->id,
                    'basic_salary' => number_format($basic, 2, '.', ''),
                    'earning' => number_format($earning, 2, '.', ''),
                    'deduction' => number_format($deduction, 2, '.', ''),
                    'gross_salary' => number_format($gross, 2, '.', ''),
                    'tax' => number_format($tax, 2, '.', ''),
                    'net_salary' => number_format($net, 2, '.', ''),
                ];
            });

        return $this->success($reportData, 'Payroll report retrieved successfully');
    }

    /**
     * Get income group report.
     */
    public function incomeGroupReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_type', 'today');
        $incomeHeadId = $request->get('income_head_id');

        $query = Income::with('incomeHead');

        if ($incomeHeadId && $incomeHeadId !== 'all') {
            $query->where('income_head_id', $incomeHeadId);
        }

        // Apply duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('date', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('date', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('date', Carbon::now()->month)->whereYear('date', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('date', Carbon::now()->subMonth()->month)->whereYear('date', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('date', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('date', Carbon::now()->subYear()->year);
                break;
        }

        $incomes = $query->orderBy('income_head_id')->orderBy('date', 'desc')->get();

        $reportData = $incomes->map(function ($income) {
            return [
                'income_head' => $income->incomeHead->name ?? 'N/A',
                'income_head_id' => $income->income_head_id,
                'income_id' => $income->id,
                'name' => $income->name ?? 'N/A',
                'date' => Carbon::parse($income->date)->format('m/d/Y'),
                'invoice_number' => $income->invoice_number ?? 'N/A',
                'amount' => number_format($income->amount, 2, '.', ''),
            ];
        });

        return $this->success($reportData, 'Income group report retrieved successfully');
    }

    /**
     * Get income group filters.
     */
    public function incomeGroupFilters(): JsonResponse
    {
        $incomeHeads = IncomeHead::select('id', 'income_head as name')->get();
        return $this->success(['income_heads' => $incomeHeads], 'Income group filters retrieved successfully');
    }

    /**
     * Get expense group report.
     */
    public function expenseGroupReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_type', 'today');
        $expenseHeadId = $request->get('expense_head_id');

        $query = Expense::with('expenseHead');

        if ($expenseHeadId && $expenseHeadId !== 'all') {
            $query->where('expense_head_id', $expenseHeadId);
        }

        // Apply duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('date', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('date', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('date', Carbon::now()->month)->whereYear('date', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('date', Carbon::now()->subMonth()->month)->whereYear('date', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('date', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('date', Carbon::now()->subYear()->year);
                break;
        }

        $expenses = $query->orderBy('expense_head_id')->orderBy('date', 'desc')->get();

        $reportData = $expenses->map(function ($expense) {
            return [
                'expense_head' => $expense->expenseHead->name ?? 'N/A',
                'expense_head_id' => $expense->expense_head_id,
                'expense_id' => $expense->id,
                'name' => $expense->name ?? 'N/A',
                'date' => Carbon::parse($expense->date)->format('m/d/Y'),
                'invoice_number' => $expense->invoice_number ?? 'N/A',
                'amount' => number_format($expense->amount, 2, '.', ''),
            ];
        });

        return $this->success($reportData, 'Expense group report retrieved successfully');
    }

    /**
     * Get expense group filters.
     */
    public function expenseGroupFilters(): JsonResponse
    {
        $expenseHeads = ExpenseHead::select('id', 'expense_head as name')->get();
        return $this->success(['expense_heads' => $expenseHeads], 'Expense group filters retrieved successfully');
    }

    /**
     * Get online admission fees collection report.
     */
    public function onlineAdmissionFeesCollectionReport(Request $request): JsonResponse
    {
        $searchType = $request->get('search_type', 'today');

        $query = OnlineAdmission::with(['schoolClass'])
            ->where('payment_status', 'Paid');

        switch ($searchType) {
            case 'today':
                $query->whereDate('updated_at', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('updated_at', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('updated_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('updated_at', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('updated_at', Carbon::now()->month)->whereYear('updated_at', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('updated_at', Carbon::now()->subMonth()->month)->whereYear('updated_at', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('updated_at', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('updated_at', Carbon::now()->subYear()->year);
                break;
        }

        $admissions = $query->latest('updated_at')->get();

        $reportData = $admissions->map(function ($admission) {
            return [
                'date' => Carbon::parse($admission->updated_at)->format('m/d/Y'),
                'admission_no' => $admission->admission_no ?? '',
                'reference_no' => $admission->reference_no,
                'name' => trim(($admission->first_name ?? '') . ' ' . ($admission->middle_name ?? '') . ' ' . ($admission->last_name ?? '')),
                'class' => $admission->schoolClass->name ?? 'N/A',
                'payment_mode' => 'Online',
                'paid_amount' => number_format($admission->paid_amount, 2, '.', ''),
            ];
        });

        return $this->success($reportData, 'Online admission fees collection report retrieved successfully');
    }

    /**
     * Get due fees report.
     */
    public function dueFeesReport(Request $request): JsonResponse
    {
        $classId = $request->get('school_class_id');
        $sectionId = $request->get('section_id');

        $query = User::where('role', 'Student')
            ->with(['schoolClass', 'section', 'studentFeeMasters.feeMaster', 'studentFeeMasters.payments']);

        if ($classId && $classId !== 'all') {
            $query->where('school_class_id', $classId);
        }

        if ($sectionId && $sectionId !== 'all') {
            $query->where('section_id', $sectionId);
        }

        $students = $query->get();

        $reportData = [];

        foreach ($students as $student) {
            $dueDetails = [];
            $totalDue = 0;

            foreach ($student->studentFeeMasters as $master) {
                $totalAmount = $master->feeMaster->amount ?? 0;
                $paid = $master->payments->sum('amount');
                $discount = $master->payments->sum('discount');
                
                $balance = $totalAmount - $paid - $discount;

                if ($balance > 0) {
                    $dueDetails[] = number_format($balance, 2, '.', '');
                    $totalDue += $balance;
                }
            }

            if ($totalDue > 0) {
                $reportData[] = [
                    'student_id' => $student->id,
                    'admission_no' => $student->admission_no ?? 'N/A',
                    'student_name' => trim(($student->first_name ?? $student->name) . ' ' . ($student->middle_name ?? '') . ' ' . ($student->last_name ?? '')),
                    'father_name' => $student->father_name ?? 'N/A',
                    'class' => ($student->schoolClass->name ?? 'N/A') . ' (' . ($student->section->name ?? 'N/A') . ')',
                    'due_amounts' => $dueDetails,
                    'total_due_amount' => number_format($totalDue, 2, '.', ''),
                    'mobile_no' => $student->phone ?? 'N/A',
                ];
            }
        }

        return $this->success($reportData, 'Due fees report retrieved successfully');
    }

    /**
     * Get income expense balance report.
     */
    public function incomeExpenseBalanceReport(Request $request): JsonResponse
    {
        $searchType = $request->get('search_type', 'today');
        
        $startDate = null;
        $endDate = null;
        
        switch ($searchType) {
            case 'today':
                $startDate = Carbon::today();
                $endDate = Carbon::today();
                break;
            case 'yesterday':
                $startDate = Carbon::yesterday();
                $endDate = Carbon::yesterday();
                break;
            case 'this_week':
                $startDate = Carbon::now()->startOfWeek();
                $endDate = Carbon::now()->endOfWeek();
                break;
            case 'last_week':
                $startDate = Carbon::now()->subWeek()->startOfWeek();
                $endDate = Carbon::now()->subWeek()->endOfWeek();
                break;
            case 'this_month':
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
            case 'last_month':
                $startDate = Carbon::now()->subMonth()->startOfMonth();
                $endDate = Carbon::now()->subMonth()->endOfMonth();
                break;
            case 'this_year':
                $startDate = Carbon::now()->startOfYear();
                $endDate = Carbon::now()->endOfYear();
                break;
            case 'last_year':
                $startDate = Carbon::now()->subYear()->startOfYear();
                $endDate = Carbon::now()->subYear()->endOfYear();
                break;
        }

        // Fetch Incomes (Direct)
        $incomes = Income::with('incomeHead')
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'name' => $item->name,
                    'head' => $item->incomeHead->name ?? 'N/A',
                    'description' => $item->note ?? '',
                    'income' => $item->amount,
                    'expense' => 0,
                ];
            });

        // Fetch Fee Payments
        $feePayments = FeePayment::with('studentFeeMaster.student')
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'name' => $item->studentFeeMaster->student->name ?? 'Student Fee',
                    'head' => 'Fees Collection',
                    'description' => $item->note ?? '',
                    'income' => $item->amount,
                    'expense' => 0,
                ];
            });

        // Fetch Online Admissions
        $onlineAdmissions = OnlineAdmission::where('payment_status', 'Paid')
            ->whereBetween('updated_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->updated_at->format('Y-m-d'),
                    'name' => trim(($item->first_name ?? '') . ' ' . ($item->last_name ?? '')),
                    'head' => 'Online Admission Fee',
                    'description' => $item->reference_no,
                    'income' => $item->paid_amount,
                    'expense' => 0,
                ];
            });

        // Fetch Expenses
        $expenses = Expense::with('expenseHead')
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'name' => $item->name,
                    'head' => $item->expenseHead->name ?? 'N/A',
                    'description' => $item->note ?? '',
                    'income' => 0,
                    'expense' => $item->amount,
                ];
            });

        // Fetch Payrolls
        $payrolls = StaffPayroll::with('staff')
            ->where('status', 'Paid')
            ->whereBetween('paid_on', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->paid_on->format('Y-m-d'),
                    'name' => $item->staff->name ?? 'Staff Salary',
                    'head' => 'Payroll',
                    'description' => "Salary for {$item->month}/{$item->year}",
                    'income' => 0,
                    'expense' => $item->net_salary,
                ];
            });

        // Combine and Sort
        $combined = $incomes->concat($feePayments)
            ->concat($onlineAdmissions)
            ->concat($expenses)
            ->concat($payrolls)
            ->sortBy('date')
            ->values();

        // Calculate Overall Balance
        $runningBalance = 0;
        $reportData = $combined->map(function($item) use (&$runningBalance) {
            $runningBalance += ($item['income'] - $item['expense']);
            return [
                'date' => Carbon::parse($item['date'])->format('m/d/Y'),
                'name' => $item['name'],
                'head' => $item['head'],
                'description' => $item['description'],
                'income' => number_format($item['income'], 2, '.', ''),
                'expense' => number_format($item['expense'], 2, '.', ''),
                'balance' => number_format($runningBalance, 2, '.', ''),
            ];
        });

        return $this->success($reportData, 'Income expense balance report retrieved successfully');
    }

    /**
     * Get expense report.
     */
    public function expenseReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_type', 'today');

        $query = Expense::with('expenseHead');

        // Date duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('date', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('date', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('date', Carbon::now()->month)->whereYear('date', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('date', Carbon::now()->subMonth()->month)->whereYear('date', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('date', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('date', Carbon::now()->subYear()->year);
                break;
        }

        $expenses = $query->orderBy('date', 'desc')->get();
        
        $reportData = $expenses->map(function ($expense) {
            return [
                'name' => $expense->name ?? 'N/A',
                'invoice_number' => $expense->invoice_number ?? 'N/A',
                'expense_head' => $expense->expenseHead->name ?? 'N/A',
                'date' => Carbon::parse($expense->date)->format('m/d/Y'),
                'amount' => number_format($expense->amount, 2, '.', ''),
            ];
        });

        return $this->success($reportData, 'Expense report retrieved successfully');
    }

    /**
     * Get balance fees report with remark.
     */
    public function balanceFeesReportWithRemark(Request $request): JsonResponse
    {
        $classId = $request->get('class_id');
        $sectionId = $request->get('section_id');

        $query = Student::with(['schoolClass', 'section', 'studentFeeMasters.feeMaster.feeGroup', 'studentFeeMasters.feeMaster.feeType', 'studentFeeMasters.feePayments']);

        if ($classId) {
            $query->where('class_id', $classId);
        }
        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }

        $students = $query->get();

        $reportData = $students->map(function ($student) {
            $totalFees = 0;
            $totalPaid = 0;
            $totalDiscount = 0;
            $totalFine = 0;
            $feeDetails = [];

            foreach ($student->studentFeeMasters as $master) {
                $amount = $master->feeMaster->amount ?? 0;
                $paid = $master->feePayments->sum('amount');
                $discount = $master->feePayments->sum('discount');
                $fine = $master->feePayments->sum('fine');

                $totalFees += $amount;
                $totalPaid += $paid;
                $totalDiscount += $discount;
                $totalFine += $fine;

                $feeDetails[] = ($master->feeMaster->feeGroup->name ?? 'N/A') . ' (' . ($master->feeMaster->feeType->name ?? 'N/A') . ': ' . ($master->feeMaster->feeType->code ?? 'N/A') . ')';
            }

            return [
                'student_name' => ($student->name ?? 'N/A') . ' ' . ($student->last_name ?? ''),
                'admission_no' => $student->admission_no ?? 'N/A',
                'class' => ($student->schoolClass->name ?? 'N/A') . '-' . ($student->section->name ?? 'N/A'),
                'fees_details' => implode(', ', $feeDetails),
                'amount' => number_format($totalFees, 2, '.', ''),
                'paid' => number_format($totalPaid, 2, '.', ''),
                'balance' => number_format($totalFees - $totalPaid - $totalDiscount, 2, '.', ''),
                'remark' => '', // Remark can be fetched from a specific field if available
            ];
        });

        return $this->success($reportData, 'Balance fees report with remark retrieved successfully');
    }

    /**
     * Get online fees collection report.
     */
    public function onlineFeesCollectionReport(Request $request): JsonResponse
    {
        $duration = $request->get('search_type', 'today');

        $query = FeePayment::with(['studentFeeMaster.student.schoolClass', 'studentFeeMaster.feeMaster.feeGroup', 'studentFeeMaster.feeMaster.feeType', 'collectedBy'])
            ->where('payment_mode', '!=', 'Cash');

        // Date duration filter
        switch ($duration) {
            case 'today':
                $query->whereDate('date', Carbon::today());
                break;
            case 'yesterday':
                $query->whereDate('date', Carbon::yesterday());
                break;
            case 'this_week':
                $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'last_week':
                $query->whereBetween('date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth('date', Carbon::now()->month)->whereYear('date', Carbon::now()->year);
                break;
            case 'last_month':
                $query->whereMonth('date', Carbon::now()->subMonth()->month)->whereYear('date', Carbon::now()->subMonth()->year);
                break;
            case 'this_year':
                $query->whereYear('date', Carbon::now()->year);
                break;
            case 'last_year':
                $query->whereYear('date', Carbon::now()->subYear()->year);
                break;
        }

        $payments = $query->orderBy('date', 'desc')->get();
        
        $reportData = $payments->map(function ($payment) {
            return [
                'payment_id' => $payment->id . '/1',
                'date' => Carbon::parse($payment->date)->format('m/d/Y'),
                'student_name' => ($payment->studentFeeMaster->student->name ?? 'N/A') . ' ' . ($payment->studentFeeMaster->student->last_name ?? ''),
                'class' => $payment->studentFeeMaster->student->schoolClass->name ?? 'N/A',
                'fees_group' => $payment->studentFeeMaster->feeMaster->feeGroup->name ?? 'N/A',
                'fees_type' => $payment->studentFeeMaster->feeMaster->feeType->name ?? 'N/A',
                'mode' => $payment->payment_mode ?? 'N/A',
                'amount' => number_format($payment->amount, 2, '.', ''),
                'discount' => number_format($payment->discount, 2, '.', ''),
                'fine' => number_format($payment->fine, 2, '.', ''),
                'total' => number_format($payment->amount + $payment->fine, 2, '.', ''),
                'collected_by' => $payment->collectedBy->name ?? 'Online',
            ];
        });

        return $this->success($reportData, 'Online fees collection report retrieved successfully');
    }

    /**
     * Get daily collection report.
     */
    public function dailyCollectionReport(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $query = FeePayment::query();

        if ($dateFrom) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('date', '<=', $dateTo);
        }

        $payments = $query->select(
            DB::raw('DATE(date) as date'),
            DB::raw('COUNT(*) as total_transactions'),
            DB::raw('SUM(amount) as amount')
        )
        ->groupBy('date')
        ->orderBy('date', 'desc')
        ->get();

        $reportData = $payments->map(function ($payment) {
            return [
                'date' => Carbon::parse($payment->date)->format('m/d/Y'),
                'total_transactions' => $payment->total_transactions,
                'amount' => number_format($payment->amount, 2, '.', ','),
            ];
        });

        return $this->success($reportData, 'Daily collection report retrieved successfully');
    }

    /**
     * Get fees statement report for a specific student.
     */
    public function feesStatement(Request $request): JsonResponse
    {
        $studentId = $request->get('student_id');

        if (!$studentId) {
            return $this->error('Student ID is required', 422);
        }

        $student = User::where('role', 'Student')
            ->with(['schoolClass', 'section'])
            ->find($studentId);

        if (!$student) {
            return $this->error('Student not found', 404);
        }

        $feeMasters = StudentFeeMaster::where('student_id', $student->id)
            ->with(['feeMaster.feeGroup', 'feeMaster.feeType', 'payments'])
            ->get();

        $fees = [];
        $totalAmount = 0;
        $totalDiscount = 0;
        $totalFine = 0;
        $totalPaid = 0;
        $totalBalance = 0;

        foreach ($feeMasters as $master) {
            $masterPaid = $master->payments->sum('amount');
            $masterDiscount = $master->payments->sum('discount');
            $masterFine = $master->payments->sum('fine');
            
            $amount = $master->feeMaster->amount;
            $balance = $amount - $masterPaid - $masterDiscount + $masterFine;
            
            $status = 'Unpaid';
            if ($masterPaid + $masterDiscount >= $amount) {
                $status = 'Paid';
            } elseif ($masterPaid > 0 || $masterDiscount > 0) {
                $status = 'Partial';
            }

            $lastPayment = $master->payments->last();

            $fees[] = [
                'group' => $master->feeMaster->feeGroup->name ?? 'N/A',
                'code' => $master->feeMaster->feeType->code ?? 'N/A',
                'dueDate' => $master->feeMaster->due_date ? Carbon::parse($master->feeMaster->due_date)->format('m/d/Y') : 'N/A',
                'status' => $status,
                'amount' => number_format($amount, 2, '.', ''),
                'paymentId' => $lastPayment ? ($lastPayment->id . '/1') : '0.00',
                'mode' => $lastPayment->payment_mode ?? '',
                'date' => $lastPayment->date ? Carbon::parse($lastPayment->date)->format('m/d/Y') : '',
                'discount' => number_format($masterDiscount, 2, '.', ''),
                'fine' => number_format($masterFine, 2, '.', ''),
                'paid' => number_format($masterPaid, 2, '.', ''),
                'balance' => number_format(max(0, $balance), 2, '.', '')
            ];

            $totalAmount += $amount;
            $totalDiscount += $masterDiscount;
            $totalFine += $masterFine;
            $totalPaid += $masterPaid;
            $totalBalance += max(0, $balance);
        }

        $reportData = [
            'admissionNo' => $student->admission_no,
            'name' => "{$student->name} {$student->last_name}",
            'fatherName' => $student->father_name ?? 'N/A',
            'mobileNumber' => $student->phone ?? 'N/A',
            'category' => $student->category ?? 'N/A',
            'classSection' => ($student->schoolClass && $student->section) ? "{$student->schoolClass->name} ({$student->section->name})" : 'N/A',
            'rollNumber' => $student->roll_no ?? 'N/A',
            'rte' => $student->rte ?? 'No',
            'fees' => $fees,
            'totalAmount' => number_format($totalAmount, 2, '.', ''),
            'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
            'totalFine' => number_format($totalFine, 2, '.', ''),
            'totalPaid' => number_format($totalPaid, 2, '.', ''),
            'totalBalance' => number_format($totalBalance, 2, '.', ''),
        ];

        return $this->success($reportData, 'Fees statement retrieved successfully');
    }
}
