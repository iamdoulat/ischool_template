<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserLog;
use App\Models\User;

class UserLogReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/user-log                                             */
    /** ------------------------------------------------------------------ */
    public function getUserLogReport(Request $request)
    {
        $roleFilter = $request->query('role', 'All');

        // Seed initial user logs for rich UI preview if empty
        if (UserLog::count() === 0) {
            $admin = User::where('role', 'Super Admin')->first();
            $adminEmail = $admin ? $admin->email : 'superadmin@gmail.com';
            $adminId = $admin ? $admin->id : null;

            $student = User::where('role', 'Student')->with(['schoolClass', 'section'])->first();
            $studentUsername = $student ? $student->username : 'std98';
            $studentId = $student ? $student->id : null;

            $teacher = User::where('role', 'Teacher')->first();
            $teacherEmail = $teacher ? $teacher->email : 'jason@gmail.com';
            $teacherId = $teacher ? $teacher->id : null;

            $parent = User::where('role', 'Parent')->first();
            $parentEmail = $parent ? $parent->email : 'parent3@gmail.com';
            $parentId = $parent ? $parent->id : null;

            $mockLogs = [
                [
                    'user_id' => $adminId,
                    'username' => $adminEmail,
                    'role' => 'Super Admin',
                    'ip_address' => '192.168.0.152',
                    'user_agent' => 'Chrome 144.0.0.0, Windows 10',
                    'created_at' => now()->subMinutes(5),
                ],
                [
                    'user_id' => $studentId,
                    'username' => $studentUsername,
                    'role' => 'Student',
                    'ip_address' => '192.168.0.152',
                    'user_agent' => 'Chrome 144.0.0.0, Windows 10',
                    'created_at' => now()->subMinutes(12),
                ],
                [
                    'user_id' => $adminId,
                    'username' => $adminEmail,
                    'role' => 'Super Admin',
                    'ip_address' => '192.168.0.152',
                    'user_agent' => 'Chrome 144.0.0.0, Windows 10',
                    'created_at' => now()->subMinutes(18),
                ],
                [
                    'user_id' => $adminId,
                    'username' => $adminEmail,
                    'role' => 'Super Admin',
                    'ip_address' => '10.110.1.5',
                    'user_agent' => 'Chrome 144.0.0.0, Windows 10',
                    'created_at' => now()->subMinutes(35),
                ],
                [
                    'user_id' => $teacherId,
                    'username' => $teacherEmail,
                    'role' => 'Teacher',
                    'ip_address' => '192.168.0.152',
                    'user_agent' => 'Chrome 144.0.0.0, Android',
                    'created_at' => now()->subMinutes(42),
                ],
                [
                    'user_id' => $parentId,
                    'username' => $parentEmail,
                    'role' => 'Parent',
                    'ip_address' => '192.168.0.155',
                    'user_agent' => 'Safari, iOS',
                    'created_at' => now()->subHours(1),
                ],
                [
                    'user_id' => null,
                    'username' => 'guest_user',
                    'role' => 'Guest',
                    'ip_address' => '192.168.0.180',
                    'user_agent' => 'Firefox 120.0, Linux',
                    'created_at' => now()->subHours(2),
                ],
            ];

            foreach ($mockLogs as $log) {
                UserLog::create($log);
            }
        }

        $query = UserLog::query()
            ->with(['user.schoolClass', 'user.section'])
            ->orderBy('id', 'desc');

        // Filter based on tab choice
        if ($roleFilter === 'Staff') {
            $query->whereIn('role', ['Super Admin', 'Admin', 'Teacher', 'Librarian', 'Receptionist', 'Accountant', 'Staff']);
        } elseif ($roleFilter === 'Students') {
            $query->where('role', 'Student');
        } elseif ($roleFilter === 'Parent') {
            $query->where('role', 'Parent');
        } elseif ($roleFilter === 'Guest') {
            $query->where('role', 'Guest');
        }

        $logs = $query->get()->map(function ($log) {
            $classStr = '-';
            if ($log->user && $log->user->schoolClass) {
                $classStr = $log->user->schoolClass->name . ($log->user->section ? '(' . $log->user->section->name . ')' : '');
            }

            return [
                'id'          => $log->id,
                'user'        => $log->username ?? ($log->user ? $log->user->email : '-'),
                'role'        => $log->role,
                'class'       => $classStr,
                'ipAddress'   => $log->ip_address ?? '-',
                'loginTime'   => $log->created_at->format('d/m/Y H:i:s'),
                'userAgent'   => $log->user_agent ?? '-',
            ];
        });

        return response()->json([
            'data' => $logs,
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  POST /reports/user-log/clear                                      */
    /** ------------------------------------------------------------------ */
    public function clearUserLogReport()
    {
        UserLog::truncate();

        return response()->json([
            'success' => true,
            'message' => 'User log records cleared successfully.',
        ]);
    }
}
