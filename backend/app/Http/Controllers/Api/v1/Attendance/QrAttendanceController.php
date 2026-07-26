<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\StudentAttendance;
use App\Models\StaffAttendance;
use Carbon\Carbon;

class QrAttendanceController extends Controller
{
    public function processScan(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = $request->code;

        // QR code data is JSON: {"qr_code":"uuid"}
        $decoded = json_decode($code, true);
        $qrCodeValue = $decoded['qr_code'] ?? $code;

        $user = User::where('qr_code', $qrCodeValue)
            ->orWhere('admission_no', $qrCodeValue)
            ->orWhere('staff_id', $qrCodeValue)
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid ID Card. User not found.'], 404);
        }

        $today = Carbon::today()->toDateString();
        $currentTime = Carbon::now()->toTimeString();

        $statusMessage = 'Attendance marked successfully';
        $statusType = 'In'; // or 'Out'

        if ($user->role === 'student') {
            $attendance = StudentAttendance::where('student_id', $user->id)
                ->where('attendance_date', $today)
                ->first();

            if ($attendance) {
                if (!$attendance->exit_time) {
                    $attendance->exit_time = $currentTime;
                    $attendance->save();
                    $statusType = 'Out';
                } else {
                    $attendance->entry_time = $currentTime;
                    $attendance->exit_time = null;
                    $attendance->save();
                }
            } else {
                StudentAttendance::create([
                    'student_id' => $user->id,
                    'attendance_date' => $today,
                    'attendance' => 'Present',
                    'entry_time' => $currentTime,
                    'source' => 'QR Scan'
                ]);
            }
        } else {
            $attendance = StaffAttendance::where('user_id', $user->id)
                ->where('attendance_date', $today)
                ->first();

            if ($attendance) {
                if (!$attendance->exit_time) {
                    $attendance->exit_time = $currentTime;
                    $attendance->save();
                    $statusType = 'Out';
                } else {
                    $attendance->entry_time = $currentTime;
                    $attendance->exit_time = null;
                    $attendance->save();
                }
            } else {
                StaffAttendance::create([
                    'user_id' => $user->id,
                    'attendance_date' => $today,
                    'attendance' => 'Present',
                    'entry_time' => $currentTime,
                    'source' => 'QR Scan'
                ]);
            }
        }

        // Handle Notifications based on Settings
        $settings = \App\Models\QrAttendanceSetting::first();
        if ($settings) {
            // Note: In a real app, this would dispatch a job to send SMS/WhatsApp
            if ($statusType === 'In' && $settings->notify_in) {
                // Send IN notification logic
                // if ($settings->notify_sms) { ... }
                // if ($settings->notify_whatsapp) { ... }
            } elseif ($statusType === 'Out' && $settings->notify_out) {
                // Send OUT notification logic
            }
        }

        return response()->json([
            'message' => $statusMessage,
            'status' => $statusType,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'admission_no' => $user->admission_no,
                'staff_id' => $user->staff_id,
                'avatar' => $user->avatar,
                'time' => $currentTime
            ]
        ]);
    }
}
