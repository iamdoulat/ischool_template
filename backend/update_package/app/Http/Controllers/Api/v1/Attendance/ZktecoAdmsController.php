<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ZktecoDevice;
use App\Models\ZktecoAttendanceLog;
use App\Models\User;
use App\Models\StudentAttendance;
use App\Models\StaffAttendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ZktecoAdmsController extends Controller
{
    /**
     * Handle ADMS POST/GET Push Data (cdata.php)
     */
    public function handleCData(Request $request)
    {
        $sn = $request->query('SN') ?: $request->input('SN');
        if (!$sn) {
            $sn = $request->header('x-serial-number') ?: 'UNKNOWN_ZK_DEVICE';
        }

        // Update or register device status
        $device = ZktecoDevice::where('serial_number', $sn)->first();
        if (!$device) {
            $device = ZktecoDevice::create([
                'name' => "ZKTeco Device ($sn)",
                'serial_number' => $sn,
                'status' => 'online',
                'last_push_at' => now(),
                'push_count' => 1,
            ]);
        } else {
            $device->update([
                'status' => 'online',
                'last_push_at' => now(),
                'push_count' => $device->push_count + 1,
            ]);
        }

        $table = $request->query('table') ?: $request->input('table');
        $rawContent = $request->getContent();

        // If GET request or no raw content, acknowledge device heartbeat
        if ($request->isMethod('get') || empty(trim($rawContent))) {
            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        $lines = explode("\n", str_replace("\r", "", trim($rawContent)));
        $processedCount = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Tab-delimited parsing: PIN \t TIME \t STATUS \t VERIFY_TYPE
            $parts = preg_split('/\t+/', $line);
            if (count($parts) < 2) {
                // Try space/comma delimited fallback
                $parts = preg_split('/\s+/', $line);
            }

            if (count($parts) >= 2) {
                $userPin = trim($parts[0]);
                $punchTimeString = trim($parts[1]);

                // Try to parse punch time
                try {
                    $punchTime = Carbon::parse($punchTimeString);
                } catch (\Exception $e) {
                    $punchTime = Carbon::now();
                }

                $statusCode = isset($parts[2]) ? trim($parts[2]) : '0';
                $verifyType = isset($parts[3]) ? trim($parts[3]) : '1';

                // Look up matching user (Student or Staff)
                $user = User::where('roll_no', $userPin)
                    ->orWhere('admission_no', $userPin)
                    ->orWhere('nfc_uid', $userPin)
                    ->orWhere('qr_code', $userPin)
                    ->orWhere('staff_id', $userPin)
                    ->orWhere('id', $userPin)
                    ->first();

                $studentId = null;
                $classId = $device->school_class_id;
                $sectionId = $device->section_id;
                $status = 'unmatched';

                if ($user) {
                    $studentId = $user->id;
                    $classId = $user->school_class_id ?: $device->school_class_id;
                    $sectionId = $user->section_id ?: $device->section_id;
                    $status = 'matched';

                    $today = $punchTime->toDateString();
                    $currentTime = $punchTime->toTimeString();

                    if (strtolower($user->role) === 'student') {
                        $attendance = StudentAttendance::where('student_id', $user->id)
                            ->where('attendance_date', $today)
                            ->first();

                        if ($attendance) {
                            if (!$attendance->exit_time && $statusCode != '0') {
                                $attendance->exit_time = $currentTime;
                                $attendance->save();
                            } else {
                                $attendance->entry_time = $currentTime;
                                $attendance->save();
                            }
                        } else {
                            StudentAttendance::create([
                                'student_id' => $user->id,
                                'attendance_date' => $today,
                                'attendance' => 'present',
                                'entry_time' => $currentTime,
                                'source' => 'ZKTeco Fingerprint/NFC',
                                'device_serial' => $sn,
                            ]);
                        }
                    } else {
                        // Staff attendance
                        $attendance = StaffAttendance::where('user_id', $user->id)
                            ->where('attendance_date', $today)
                            ->first();

                        if ($attendance) {
                            if (!$attendance->exit_time && $statusCode != '0') {
                                $attendance->exit_time = $currentTime;
                                $attendance->save();
                            } else {
                                $attendance->entry_time = $currentTime;
                                $attendance->save();
                            }
                        } else {
                            StaffAttendance::create([
                                'user_id' => $user->id,
                                'attendance_date' => $today,
                                'attendance' => 'present',
                                'entry_time' => $currentTime,
                                'source' => 'ZKTeco Biometric',
                                'device_serial' => $sn,
                            ]);
                        }
                    }
                }

                // Record ZKTeco Log
                ZktecoAttendanceLog::create([
                    'device_serial' => $sn,
                    'user_pin' => $userPin,
                    'punch_time' => $punchTime,
                    'verify_type' => $verifyType,
                    'status_code' => $statusCode,
                    'student_id' => $studentId,
                    'school_class_id' => $classId,
                    'section_id' => $sectionId,
                    'processed' => true,
                    'status' => $status,
                ]);

                $processedCount++;
            }
        }

        return response("OK: $processedCount", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Handle ADMS GET commands / heartbeat (getrequest.php)
     */
    public function handleGetRequest(Request $request)
    {
        $sn = $request->query('SN') ?: $request->input('SN');
        if ($sn) {
            ZktecoDevice::where('serial_number', $sn)->update([
                'status' => 'online',
                'last_push_at' => now(),
            ]);
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }
}
