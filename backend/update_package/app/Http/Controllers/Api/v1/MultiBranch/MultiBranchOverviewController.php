<?php

namespace App\Http\Controllers\Api\v1\MultiBranch;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\Currency;
use App\Models\FeePayment;
use App\Models\GeneralSetting;
use App\Models\LibraryMember;
use App\Models\OnlineAdmission;
use App\Models\StaffAttendance;
use App\Models\StaffPayroll;
use App\Models\StudentFeeMaster;
use App\Models\StudentTransportAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Aggregated overview for the CURRENT branch (this database).
 *
 * Note: multi-branch in this product = a separate database per branch URL
 * (the `branches` table only stores name + URL, there is no branch_id on any
 * record). So these figures reflect the institution served by THIS database,
 * presented under the school's own name.
 */
class MultiBranchOverviewController extends Controller
{
    public function index()
    {
        $general = GeneralSetting::first();
        $branch = $general->school_name ?? 'Home Branch';
        $symbol = Currency::where('is_active', true)->value('symbol') ?? '$';

        // Resolve the current session LABEL for display. `general_settings.session`
        // may hold either the label ("2025-26") or the session id, so handle both.
        $gsSession = $general->session ?? null;
        if ($gsSession !== null && is_numeric($gsSession)) {
            $sessionLabel = AcademicSession::where('id', $gsSession)->value('session');
        } else {
            $sessionLabel = $gsSession;
        }
        $sessionLabel = $sessionLabel ?: (AcademicSession::where('is_active', true)->orderByDesc('id')->value('session') ?? '-');

        $money = fn ($v) => $symbol . number_format((float) $v, 2);

        // ── Fees ──────────────────────────────────────────────
        // Records are not reliably tagged with academic_session_id in this DB, so
        // these are institution-wide totals (matching DashboardController behaviour).
        $totalStudents = User::where('role', 'Student')->count();

        $totalAssigned = $this->safe(fn () => (float) StudentFeeMaster::query()
            ->join('fee_masters', 'student_fee_masters.fee_master_id', '=', 'fee_masters.id')
            ->sum('fee_masters.amount'));

        $totalPaid = $this->safe(fn () => (float) FeePayment::sum('amount'));

        $feesBalance = max(0, $totalAssigned - $totalPaid);

        // ── Transport (assigned monthly fees; no payment table exists) ──
        $transportTotal = $this->safe(fn () => (float) StudentTransportAssignment::query()
            ->where('student_transport_assignments.is_active', true)
            ->join('transport_route_pickup_points', function ($j) {
                $j->on('student_transport_assignments.route_id', '=', 'transport_route_pickup_points.route_id')
                  ->on('student_transport_assignments.pickup_point_id', '=', 'transport_route_pickup_points.pickup_point_id');
            })
            ->sum('transport_route_pickup_points.monthly_fees'));

        // ── Admissions ────────────────────────────────────────
        $onlineAdmissions = $this->safe(fn () => OnlineAdmission::count());
        $offlineAdmissions = max(0, $totalStudents - $onlineAdmissions);

        // ── Library ───────────────────────────────────────────
        $totalBooks = $this->safe(fn () => (int) Book::sum('qty'));
        $libraryMembers = $this->safe(fn () => LibraryMember::count());
        $booksIssued = $this->safe(fn () => BookIssue::count());

        // ── Payroll (current month) ───────────────────────────
        $month = (int) now()->format('n');
        $year = (int) now()->format('Y');
        $totalStaff = $this->safe(fn () => User::whereNotIn('role', ['Student', 'Parent'])->where('active', true)->count());

        $payrollBase = StaffPayroll::where('month', $month)->where('year', $year);
        $generated = $this->safe(fn () => (clone $payrollBase)->where('status', 'Generated')->count());
        $paidCount = $this->safe(fn () => (clone $payrollBase)->where('status', 'Paid')->count());
        $netAmount = $this->safe(fn () => (float) (clone $payrollBase)->sum('net_salary'));
        $paidAmount = $this->safe(fn () => (float) (clone $payrollBase)->where('status', 'Paid')->sum('net_salary'));

        // ── Staff attendance (today) ──────────────────────────
        $presentToday = $this->safe(fn () => StaffAttendance::whereDate('attendance_date', today())
            ->whereIn('attendance', ['present', 'late', 'half_day', 'half_day_second'])
            ->count());
        $absentToday = max(0, $totalStaff - $presentToday);

        return response()->json([
            'fees_details' => [[
                'id' => 1, 'branch' => $branch, 'session' => $sessionLabel, 'students' => $totalStudents,
                'totalFees' => $money($totalAssigned), 'paidFees' => $money($totalPaid), 'balanceFees' => $money($feesBalance),
            ]],
            'transport_details' => [[
                'id' => 1, 'branch' => $branch, 'session' => $sessionLabel,
                'totalFees' => $money($transportTotal), 'paidFees' => $money(0), 'balanceFees' => $money($transportTotal),
            ]],
            'admission_details' => [[
                'id' => 1, 'branch' => $branch, 'session' => $sessionLabel,
                'offline' => $offlineAdmissions, 'online' => $onlineAdmissions,
            ]],
            'library_details' => [[
                'id' => 1, 'branch' => $branch,
                'totalBooks' => $totalBooks, 'members' => $libraryMembers, 'bookIssued' => $booksIssued,
            ]],
            'payroll_details' => [[
                'id' => 1, 'branch' => $branch, 'totalStaff' => $totalStaff, 'generated' => $generated,
                'paid' => $paidCount, 'netAmount' => $money($netAmount), 'paidAmount' => $money($paidAmount),
            ]],
            'attendance_details' => [[
                'id' => 1, 'branch' => $branch, 'totalStaff' => $totalStaff,
                'present' => $presentToday, 'absent' => $absentToday,
            ]],
        ]);
    }

    /**
     * Run an aggregate safely — return 0 if the underlying table/columns differ.
     */
    private function safe(callable $fn)
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            return 0;
        }
    }
}
