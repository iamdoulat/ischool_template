<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AuditTrail;
use App\Models\User;

class AuditTrailReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/audit-trail                                          */
    /** ------------------------------------------------------------------ */
    public function getAuditTrailReport(Request $request)
    {
        // Seed initial audit trail logs for rich UI preview if empty
        if (AuditTrail::count() === 0) {
            $admin = User::where('role', 'Super Admin')->first();
            $adminId = $admin ? $admin->id : null;

            $mockLogs = [
                [
                    'message' => 'Super Admin logged in successfully from Firefox browser.',
                    'user_id' => $adminId,
                    'ip_address' => '192.168.1.15',
                    'action' => 'Login',
                    'platform' => 'Windows 11',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                    'created_at' => now()->subMinutes(45),
                    'updated_at' => now()->subMinutes(45),
                ],
                [
                    'message' => 'Created a new Academic Class "Class 6" with Section A & B.',
                    'user_id' => $adminId,
                    'ip_address' => '192.168.1.15',
                    'action' => 'Create Class',
                    'platform' => 'Windows 11',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                    'created_at' => now()->subMinutes(30),
                    'updated_at' => now()->subMinutes(30),
                ],
                [
                    'message' => 'Allocated Student Mohammed Khan to Hostel Room "Room 101-A".',
                    'user_id' => $adminId,
                    'ip_address' => '192.168.1.15',
                    'action' => 'Allocate Room',
                    'platform' => 'Windows 11',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                    'created_at' => now()->subMinutes(20),
                    'updated_at' => now()->subMinutes(20),
                ],
                [
                    'message' => 'Updated Financial Setup parameters: currency set to active.',
                    'user_id' => $adminId,
                    'ip_address' => '192.168.1.15',
                    'action' => 'Update Settings',
                    'platform' => 'Windows 11',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                    'created_at' => now()->subMinutes(10),
                    'updated_at' => now()->subMinutes(10),
                ],
                [
                    'message' => 'Triggered full system DB backup download.',
                    'user_id' => $adminId,
                    'ip_address' => '192.168.1.15',
                    'action' => 'Backup DB',
                    'platform' => 'Windows 11',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                    'created_at' => now()->subMinutes(5),
                    'updated_at' => now()->subMinutes(5),
                ],
            ];

            foreach ($mockLogs as $log) {
                AuditTrail::create($log);
            }
        }

        $logs = AuditTrail::with('user')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id'         => $log->id,
                    'message'    => $log->message,
                    'users'      => $log->user ? ($log->user->name . ' (' . $log->user->role . ')') : 'System / Guest',
                    'ip_address' => $log->ip_address ?? '-',
                    'action'     => $log->action ?? '-',
                    'platform'   => $log->platform ?? '-',
                    'agent'      => $log->user_agent ?? '-',
                    'date_time'  => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'data' => $logs,
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  POST /reports/audit-trail/clear                                   */
    /** ------------------------------------------------------------------ */
    public function clearAuditTrailReport()
    {
        AuditTrail::truncate();

        return response()->json([
            'success' => true,
            'message' => 'Audit trail records cleared successfully.',
        ]);
    }
}
