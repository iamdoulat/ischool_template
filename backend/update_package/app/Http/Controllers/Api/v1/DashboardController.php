<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FeePayment;
use App\Models\LeaveRequest;
use App\Models\AdmissionEnquiry;
use App\Models\User;
use App\Models\Income;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\StudentAttendance;
use App\Models\StaffAttendance;
use App\Models\Role;
use App\Models\StudentFeeMaster;
use App\Models\BookIssue;
use App\Models\GeneralSetting;
use App\Models\Currency;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Basic counts
        $studentCount = User::where('role', 'Student')->count();
        $staffCount = User::whereNotIn('role', ['Student', 'Parent'])->count();

        // Income & Expense for the current month
        // Monthly fee collections (from fee payments)
        $monthlyFeeCollection = FeePayment::whereBetween('date', [$startOfMonth, $endOfMonth])->sum('amount');
        // Monthly other income (from income table)
        $monthlyIncome = Income::whereBetween('date', [$startOfMonth, $endOfMonth])->sum('amount');
        // Combined monthly income = fee collection + other income
        $monthlyTotalIncome = floatval($monthlyFeeCollection) + floatval($monthlyIncome);
        $monthlyExpenses = Expense::whereBetween('date', [$startOfMonth, $endOfMonth])->sum('amount');

        // All-time totals (for richer real data when monthly is zero)
        $totalFeeCollection = FeePayment::sum('amount');
        $totalIncome = Income::sum('amount');
        $totalExpenses = Expense::sum('amount');

        // Staff approved leave today
        $staffApprovedLeave = LeaveRequest::where('status', 'approved')
            // ->whereDate('from_date', '<=', $today)
            // ->whereDate('to_date', '>=', $today)
            ->count();

        // Student approved leave (assuming same table or another)
        $studentApprovedLeave = 0; // Mock or implement if table differs

        $studentsPresentToday = StudentAttendance::whereDate('attendance_date', $today)->where('attendance', 'Present')->count();
        $staffPresentToday = StaffAttendance::whereDate('attendance_date', $today)->where('attendance', 'Present')->count();

        // Enquiries
        $convertedLeads = AdmissionEnquiry::where('status', 'won')->count();
        $totalLeads = AdmissionEnquiry::count();

        $enquiryOverview = AdmissionEnquiry::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();

        // Format Daily Finance
        $dailyFinance = [];
        for ($i = 1; $i <= $endOfMonth->day; $i++) {
            $dateObj = Carbon::now()->startOfMonth()->addDays($i - 1);
            $dailyCollections = floatval(FeePayment::whereDate('date', $dateObj)->sum('amount')) 
                              + floatval(Income::whereDate('date', $dateObj)->sum('amount'));
            $dailyExpenses = floatval(Expense::whereDate('date', $dateObj)->sum('amount'));

            $dailyFinance[] = [
                'day' => str_pad($i, 2, '0', STR_PAD_LEFT),
                'collections' => $dailyCollections,
                'expenses' => $dailyExpenses
            ];
        }

        // Overviews
        $enquiryFormatted = $enquiryOverview->map(function ($item) use ($totalLeads) {
            $colors = [
                'active' => 'bg-red-500',
                'won' => 'bg-yellow-500',
                'passive' => 'bg-cyan-600',
                'lost' => 'bg-orange-400',
                'dead' => 'bg-yellow-400'
            ];
            return [
                'label' => strtoupper($item->status),
                'value' => $item->total,
                'percentage' => $totalLeads > 0 ? round(($item->total / $totalLeads) * 100, 2) : 0,
                'color' => $colors[strtolower($item->status)] ?? 'bg-gray-500'
            ];
        });

        // Expenses distribution
        $expenseDist = Expense::select('expense_head_id', DB::raw('sum(amount) as total'))
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->groupBy('expense_head_id')
            ->with('expenseHead')
            ->get()->map(function($e) {
                return [
                    'name' => $e->expenseHead ? ($e->expenseHead->expense_head ?? 'Unknown') : 'Unknown',
                    'value' => (float) $e->total,
                    'color' => '#' . substr(md5($e->expense_head_id), 0, 6)
                ];
            });

        // Income distribution
        $incomeDist = Income::select('income_head_id', DB::raw('sum(amount) as total'))
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->groupBy('income_head_id')
            ->with('incomeHead')
            ->get()->map(function($i) {
                return [
                    'name' => $i->incomeHead ? ($i->incomeHead->income_head ?? 'Unknown') : 'Unknown',
                    'value' => (float) $i->total,
                    'color' => '#' . substr(md5($i->income_head_id), 0, 6)
                ];
            });


        $finance = [];
        for ($i = 0; $i < 12; $i++) {
            $monthDate = Carbon::now()->startOfYear()->addMonths($i);
            $collections = floatval(FeePayment::whereMonth('date', $monthDate->month)
                            ->whereYear('date', $monthDate->year)->sum('amount')) 
                           + floatval(Income::whereMonth('date', $monthDate->month)
                            ->whereYear('date', $monthDate->year)->sum('amount'));
            $expenses = floatval(Expense::whereMonth('date', $monthDate->month)
                         ->whereYear('date', $monthDate->year)->sum('amount'));
            $finance[] = [
                'month' => $monthDate->format('M'),
                'collections' => $collections,
                'expenses' => $expenses
            ];
        }

        // ---- Fees overview (expected vs paid) ----
        // Expected = sum of every FeeMaster amount allocated to a student via StudentFeeMaster.
        $totalExpectedFees = (float) StudentFeeMaster::query()
            ->join('fee_masters', 'fee_masters.id', '=', 'student_fee_masters.fee_master_id')
            ->sum('fee_masters.amount');
        $totalPaidFees = (float) FeePayment::sum('amount');
        $totalUnpaidFees = max(0, $totalExpectedFees - $totalPaidFees);

        // Students with at least one fee allocation, and how many still owe.
        $studentsWithFees = StudentFeeMaster::distinct('student_id')->count('student_id');
        $studentsFullyPaid = StudentFeeMaster::query()
            ->select('student_fee_masters.student_id')
            ->join('fee_masters', 'fee_masters.id', '=', 'student_fee_masters.fee_master_id')
            ->leftJoin('fee_payments', 'fee_payments.student_fee_master_id', '=', 'student_fee_masters.id')
            ->groupBy('student_fee_masters.student_id')
            ->havingRaw('COALESCE(SUM(fee_payments.amount), 0) >= SUM(fee_masters.amount)')
            ->get()->count();
        $studentsAwaitingPayment = max(0, $studentsWithFees - $studentsFullyPaid);

        $feesPaidPct = $totalExpectedFees > 0 ? round(($totalPaidFees / $totalExpectedFees) * 100, 2) : 0;
        $feesUnpaidPct = $totalExpectedFees > 0 ? round(($totalUnpaidFees / $totalExpectedFees) * 100, 2) : 0;

        // ---- Library overview (issued vs returned) ----
        $booksIssued = BookIssue::whereNull('return_date')->count();
        $booksReturned = BookIssue::whereNotNull('return_date')->count();
        $totalIssues = $booksIssued + $booksReturned;

        // ---- Student attendance breakdown for today ----
        $studentsAbsentToday = StudentAttendance::whereDate('attendance_date', $today)->where('attendance', 'Absent')->count();
        $studentsLateToday = StudentAttendance::whereDate('attendance_date', $today)->where('attendance', 'Late')->count();
        $studentsHalfDayToday = StudentAttendance::whereDate('attendance_date', $today)->where('attendance', 'Half Day')->count();

        // ---- Student approved leave (users with Student role) ----
        $studentApprovedLeave = LeaveRequest::where('status', 'approved')
            ->whereHas('user', fn ($q) => $q->where('role', 'Student'))
            ->count();

        // ---- Currency symbol: use active Currency record, not GeneralSetting.currency_format
        //      (currency_format stores a pattern string, not a symbol) ----
        $currencySymbol = Currency::where('is_active', true)->value('symbol') ?? '$';

        $pct = fn ($part, $whole) => $whole > 0 ? round(($part / $whole) * 100, 2) : 0;

        $visibleWidgets = $this->getVisibleWidgets($request);

        return response()->json([
            'visible_widgets' => $visibleWidgets,
            'stats' => [
                'feesAwaitingPayment' => ['current' => $studentsAwaitingPayment, 'total' => $studentsWithFees ?: $studentCount, 'percentage' => $pct($studentsAwaitingPayment, $studentsWithFees), 'color' => 'blue'],
                'staffApprovedLeave' => ['current' => $staffApprovedLeave, 'total' => $staffCount, 'percentage' => $staffCount > 0 ? round(($staffApprovedLeave / $staffCount) * 100) : 0, 'color' => 'cyan'],
                'studentApprovedLeave' => ['current' => $studentApprovedLeave, 'total' => $studentCount, 'percentage' => $pct($studentApprovedLeave, $studentCount), 'color' => 'indigo'],
                'convertedLeads' => ['current' => $convertedLeads, 'total' => $totalLeads, 'percentage' => $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100) : 0, 'color' => 'red'],
                'staffPresentToday' => ['current' => $staffPresentToday, 'total' => $staffCount, 'percentage' => $staffCount > 0 ? round(($staffPresentToday / $staffCount) * 100) : 0, 'color' => 'orange'],
                'studentsPresentToday' => ['current' => $studentsPresentToday, 'total' => $studentCount, 'percentage' => $studentCount > 0 ? round(($studentsPresentToday / $studentCount) * 100) : 0, 'color' => 'yellow'],
            ],
            'dailyFinance' => $dailyFinance,
            'expenseDistribution' => count($expenseDist) > 0 ? $expenseDist : [
                ['name' => 'No Data', 'value' => 1, 'color' => '#d1d5db']
            ],
            'incomeDistribution' => count($incomeDist) > 0 ? $incomeDist : [
                ['name' => 'No Data', 'value' => 1, 'color' => '#d1d5db']
            ],
            'finance' => $finance,
            'overviews' => [
                'fees' => [
                    ['label' => 'UNPAID', 'value' => $currencySymbol . number_format($totalUnpaidFees, 2), 'percentage' => $feesUnpaidPct, 'color' => 'bg-blue-600'],
                    ['label' => 'PAID', 'value' => $currencySymbol . number_format($totalPaidFees, 2), 'percentage' => $feesPaidPct, 'color' => 'bg-cyan-500']
                ],
                'enquiry' => count($enquiryFormatted) > 0 ? $enquiryFormatted : [
                    ['label' => 'ACTIVE', 'value' => 0, 'percentage' => 0, 'color' => 'bg-red-500']
                ],
                'library' => [
                    ['label' => 'ISSUED', 'value' => $booksIssued, 'percentage' => $pct($booksIssued, $totalIssues), 'color' => 'bg-indigo-600'],
                    ['label' => 'RETURNED', 'value' => $booksReturned, 'percentage' => $pct($booksReturned, $totalIssues), 'color' => 'bg-cyan-500']
                ],
                'attendance' => [
                    ['label' => 'PRESENT', 'value' => $studentsPresentToday, 'percentage' => $pct($studentsPresentToday, $studentCount), 'color' => 'bg-emerald-500'],
                    ['label' => 'ABSENT', 'value' => $studentsAbsentToday, 'percentage' => $pct($studentsAbsentToday, $studentCount), 'color' => 'bg-red-500'],
                    ['label' => 'LATE', 'value' => $studentsLateToday, 'percentage' => $pct($studentsLateToday, $studentCount), 'color' => 'bg-yellow-500'],
                    ['label' => 'HALF DAY', 'value' => $studentsHalfDayToday, 'percentage' => $pct($studentsHalfDayToday, $studentCount), 'color' => 'bg-orange-500']
                ]
            ],
            'summary' => [
                // Raw floats — the frontend formats these with the active currency symbol
                'monthlyFeesAmount'    => round($monthlyTotalIncome, 2),
                'monthlyExpensesAmount'=> round(floatval($monthlyExpenses), 2),
                'totalIncomeAmount'    => round($totalFeeCollection + $totalIncome, 2),
                'totalExpensesAmount'  => round($totalExpenses, 2),
                // Keep formatted strings as fallback for any other consumers
                'monthlyFees'    => $currencySymbol . number_format($monthlyTotalIncome, 2),
                'monthlyExpenses'=> $currencySymbol . number_format(floatval($monthlyExpenses), 2),
                'studentCount' => $studentCount,
                'studentHeadCount' => $studentCount,
                'admin' => User::where('role', 'Admin')->count(),
                'teacher' => User::where('role', 'Teacher')->count(),
                'accountant' => User::where('role', 'Accountant')->count(),
                'librarian' => User::where('role', 'Librarian')->count(),
                'receptionist' => User::where('role', 'Receptionist')->count(),
                'superAdmin' => User::where('role', 'Super Admin')->count(),
                'driver' => User::where('role', 'Driver')->count(),
            ]
        ]);
    }

    private function getVisibleWidgets(Request $request): array
    {
        $allWidgets = [
            'fees_awaiting_payment',
            'staff_approved_leave',
            'student_approved_leave',
            'converted_leads',
            'staff_present_today',
            'student_present_today',
            'charts_section',
            'overview_section',
            'summary_monthly_fees',
            'summary_monthly_expenses',
            'summary_student',
            'summary_student_head_count',
            'summary_admin',
            'summary_teacher',
            'summary_accountant',
            'summary_librarian',
            'summary_receptionist',
            'summary_super_admin',
            'summary_driver',
        ];

        $user = $request->user();
        if (!$user) {
            return $allWidgets;
        }

        $role = Role::where('name', $user->role)->first();
        if (!$role) {
            return $allWidgets;
        }

        $widgetKeys = $role->dashboardWidgets()->pluck('widget_key')->toArray();
        return !empty($widgetKeys) ? $widgetKeys : $allWidgets;
    }
}
