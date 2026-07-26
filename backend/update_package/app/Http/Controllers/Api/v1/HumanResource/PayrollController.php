<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Controller;
use App\Models\StaffPayroll;
use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    /**
     * List payroll records filtered by role, month, year with pagination and search.
     * GET /api/v1/hr/payroll?role=Teacher&month=2&year=2026&keyword=maria&per_page=10&page=1
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000|max:2100',
            'role' => 'nullable|string',
            'keyword' => 'nullable|string',
            'per_page' => 'nullable|integer|in:10,25,50,100',
        ]);

        $month = $request->integer('month');
        $year = $request->integer('year');
        $role = $request->query('role');
        $keyword = $request->query('keyword');
        $perPage = $request->integer('per_page', 10);

        // Build staff query
        $staffQuery = User::whereNotIn('role', ['Student', 'Parent'])
            ->where('active', true);

        if ($role) {
            $staffQuery->where('role', $role);
        }
        if ($keyword) {
            $staffQuery->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('staff_id', 'like', "%{$keyword}%");
            });
        }

        $staff = $staffQuery->orderBy('name')->get([
            'id', 
            'staff_id', 
            'name', 
            'role', 
            'department', 
            'designation', 
            'phone',
            'basic_salary',
            'house_rent',
            'medical_allowance',
            'conveyance_allowance',
            'food_allowance'
        ]);

        // Fetch existing payroll records
        $payrolls = StaffPayroll::where('month', $month)
            ->where('year', $year)
            ->whereIn('user_id', $staff->pluck('id'))
            ->get()
            ->keyBy('user_id');

        // Merge into result rows
        $rows = $staff->map(function ($member) use ($payrolls, $month, $year) {
            $payroll = $payrolls->get($member->id);
            return [
                'id' => $member->id,
                'payroll_id' => $payroll?->id,
                'staff_id' => $member->staff_id,
                'name' => $member->name,
                'role' => $member->role,
                'department' => $member->department,
                'designation' => $member->designation,
                'phone' => $member->phone,
                'basic_salary' => $payroll?->basic_salary ?? $member->basic_salary ?? 0,
                'allowances' => $payroll?->allowances ?? 0,
                'deductions' => $payroll?->deductions ?? 0,
                'profile_basic_salary' => $member->basic_salary ?? 0,
                'profile_house_rent' => $member->house_rent ?? 0,
                'profile_medical_allowance' => $member->medical_allowance ?? 0,
                'profile_conveyance_allowance' => $member->conveyance_allowance ?? 0,
                'profile_food_allowance' => $member->food_allowance ?? 0,
                'net_salary' => $payroll?->net_salary ?? 0,
                'status' => $payroll?->status ?? null,
                'paid_on' => $payroll?->paid_on,
                'note' => $payroll?->note,
            ];
        });

        // Manual pagination
        $total = $rows->count();
        $page = $request->integer('page', 1);
        $sliced = $rows->forPage($page, $perPage)->values();

        return response()->json([
            'success' => true,
            'data' => $sliced,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Generate (upsert) payroll for one staff member.
     * POST /api/v1/hr/payroll
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2000',
            'basic_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ]);

        $allowances = $data['allowances'] ?? 0;
        $deductions = $data['deductions'] ?? 0;
        $net = $data['basic_salary'] + $allowances - $deductions;

        $payroll = StaffPayroll::updateOrCreate(
            ['user_id' => $data['user_id'], 'month' => $data['month'], 'year' => $data['year']],
            [
                'basic_salary' => $data['basic_salary'],
                'allowances' => $allowances,
                'deductions' => $deductions,
                'net_salary' => $net,
                'status' => 'Generated',
                'note' => $data['note'] ?? null,
            ]
        );

        $staff = User::find($data['user_id']);
        if ($staff) {
            $monthName = date('F', mktime(0, 0, 0, $data['month'], 10));
            NotificationDispatcher::dispatch('Salary Generated', [
                'name' => $staff->name,
                'net_salary' => $net,
                'month_name' => $monthName,
                'year' => $data['year'],
                'basic_salary' => $data['basic_salary'],
                'allowances' => $allowances,
                'deductions' => $deductions,
            ], ['staff_id' => $staff->id]);
        }

        return response()->json(['success' => true, 'message' => 'Payroll generated.', 'data' => $payroll]);
    }

    /**
     * Mark payroll as Paid.
     * PUT /api/v1/hr/payroll/{id}/pay
     */
    public function pay(int $id): JsonResponse
    {
        $payroll = StaffPayroll::findOrFail($id);
        $payroll->update(['status' => 'Paid', 'paid_on' => now()->toDateString()]);

        $staff = User::find($payroll->user_id);
        if ($staff) {
            $monthName = date('F', mktime(0, 0, 0, $payroll->month, 10));
            NotificationDispatcher::dispatch('Salary Paid', [
                'name' => $staff->name,
                'net_salary' => $payroll->net_salary,
                'month_name' => $monthName,
                'year' => $payroll->year,
                'paid_on' => now()->toDateString(),
            ], ['staff_id' => $staff->id]);
        }

        return response()->json(['success' => true, 'message' => 'Marked as paid.', 'data' => $payroll]);
    }

    /**
     * Update payroll details.
     * PUT /api/v1/hr/payroll/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $payroll = StaffPayroll::findOrFail($id);

        $data = $request->validate([
            'basic_salary' => 'sometimes|numeric|min:0',
            'allowances' => 'sometimes|numeric|min:0',
            'deductions' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:Generated,Paid,Unpaid',
            'note' => 'nullable|string|max:500',
        ]);

        if (isset($data['basic_salary']) || isset($data['allowances']) || isset($data['deductions'])) {
            $basic = $data['basic_salary'] ?? $payroll->basic_salary;
            $allowances = $data['allowances'] ?? $payroll->allowances;
            $deductions = $data['deductions'] ?? $payroll->deductions;
            $data['net_salary'] = $basic + $allowances - $deductions;
        }

        $payroll->update($data);
        return response()->json(['success' => true, 'message' => 'Payroll updated.', 'data' => $payroll]);
    }

    /**
     * Get last 12 months payroll history for a staff member.
     * GET /api/v1/hr/payroll/history/{userId}
     */
    public function history(int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $now = now();
        $history = [];

        for ($i = 0; $i < 12; $i++) {
            $date  = $now->copy()->subMonths($i);
            $month = (int) $date->format('n');
            $year  = (int) $date->format('Y');

            $payroll = StaffPayroll::where('user_id', $userId)
                ->where('month', $month)
                ->where('year', $year)
                ->first();

            $history[] = [
                'month'        => $month,
                'year'         => $year,
                'basic_salary' => $payroll?->basic_salary ?? null,
                'allowances'   => $payroll?->allowances ?? null,
                'deductions'   => $payroll?->deductions ?? null,
                'net_salary'   => $payroll?->net_salary ?? null,
                'status'       => $payroll?->status ?? null,
                'paid_on'      => $payroll?->paid_on ? $payroll->paid_on->format('Y-m-d') : null,
                'note'         => $payroll?->note ?? null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'staff' => [
                    'id'          => $user->id,
                    'staff_id'    => $user->staff_id,
                    'name'        => $user->name,
                    'role'        => $user->role,
                    'designation' => $user->designation,
                    'department'  => $user->department,
                ],
                'history' => $history,
            ],
        ]);
    }
}
