<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use App\Models\SmartAttendanceSetting;
use App\Models\SmartAttendanceRecord;
use App\Models\StudentAttendance;
use App\Models\StaffAttendance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SmartAttendanceController extends BaseController
{
    public function getSettings(): JsonResponse
    {
        $setting = SmartAttendanceSetting::first() ?? SmartAttendanceSetting::create([
            'is_face_enabled' => true,
            'is_qr_enabled' => true,
            'is_nfc_enabled' => true,
        ]);

        return $this->success($setting, 'Smart attendance settings fetched');
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'is_face_enabled' => 'required|boolean',
            'is_qr_enabled' => 'required|boolean',
            'is_nfc_enabled' => 'required|boolean',
        ]);

        $setting = SmartAttendanceSetting::first();
        if (!$setting) {
            $setting = new SmartAttendanceSetting();
        }

        $setting->is_face_enabled = $request->input('is_face_enabled');
        $setting->is_qr_enabled = $request->input('is_qr_enabled');
        $setting->is_nfc_enabled = $request->input('is_nfc_enabled');
        $setting->save();

        return $this->success($setting, 'Smart attendance settings updated');
    }

    public function markAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'method' => 'required|in:face,qr,nfc',
        ]);

        $user = User::findOrFail($request->user_id);
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');
        $source = $request->method === 'face' ? 'Face Recognition' : ($request->method === 'qr' ? 'QR Scan' : 'NFC Scan');

        // Prevent duplicate within 30 seconds for same user+method
        $recent = SmartAttendanceRecord::where('user_id', $user->id)
            ->where('method', $request->method)
            ->where('attendance_date', $today)
            ->where('attendance_time', '>=', date('H:i:s', strtotime('-30 seconds')))
            ->first();

        if ($recent) {
            return $this->success([
                'user' => [
                    'name' => $user->name,
                    'role' => $user->role,
                    'avatar' => $user->avatar,
                ],
                'time' => $currentTime,
                'date' => $today,
                'method' => $request->method,
                'status' => 'Duplicate',
                'already_marked' => true,
            ], 'Already marked recently');
        }

        // Record in smart_attendance_records (terminal log)
        SmartAttendanceRecord::create([
            'user_id' => $user->id,
            'attendance_date' => $today,
            'attendance_time' => $currentTime,
            'method' => $request->method,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Record in student_attendances / staff_attendances with In/Out logic
        $statusType = 'In';
        if ($user->role === 'student') {
            $record = StudentAttendance::where('student_id', $user->id)
                ->where('attendance_date', $today)
                ->first();

            if ($record) {
                if (!$record->exit_time) {
                    // Second scan → Out
                    $record->update([
                        'exit_time' => $currentTime,
                        'source' => $source,
                    ]);
                    $statusType = 'Out';
                } else {
                    // Already has both In+Out → restart cycle as In
                    $record->update([
                        'entry_time' => $currentTime,
                        'exit_time' => null,
                        'source' => $source,
                    ]);
                }
            } else {
                // First scan → In
                $record = StudentAttendance::create([
                    'student_id' => $user->id,
                    'attendance_date' => $today,
                    'attendance' => 'Present',
                    'entry_time' => $currentTime,
                    'source' => $source,
                ]);
            }
        } else {
            $record = StaffAttendance::where('user_id', $user->id)
                ->where('attendance_date', $today)
                ->first();

            if ($record) {
                if (!$record->exit_time) {
                    $record->update([
                        'exit_time' => $currentTime,
                        'source' => $source,
                    ]);
                    $statusType = 'Out';
                } else {
                    $record->update([
                        'entry_time' => $currentTime,
                        'exit_time' => null,
                        'source' => $source,
                    ]);
                }
            } else {
                $record = StaffAttendance::create([
                    'user_id' => $user->id,
                    'attendance_date' => $today,
                    'attendance' => 'Present',
                    'entry_time' => $currentTime,
                    'source' => $source,
                ]);
            }
        }

        return $this->success([
            'user' => [
                'name' => $user->name,
                'role' => $user->role,
                'avatar' => $user->avatar,
            ],
            'time' => $currentTime,
            'date' => $today,
            'method' => $request->method,
            'status' => $statusType,
            'already_marked' => false,
        ], "Attendance {$statusType} recorded successfully via {$request->method}!");
    }

    public function getRecords(Request $request): JsonResponse
    {
        $today = $request->query('date', date('Y-m-d'));
        $limit = min((int) $request->query('limit', 50), 200);

        $records = SmartAttendanceRecord::where('attendance_date', $today)
            ->with('user:id,name,role,avatar,admission_no,staff_id')
            ->orderBy('attendance_time', 'desc')
            ->limit($limit)
            ->get();

        // Pre-load attendance records for In/Out status lookup
        $studentUserIds = $records->filter(fn($r) => $r->user && $r->user->role === 'student')
            ->pluck('user_id')->unique()->values()->toArray();
        $staffUserIds = $records->filter(fn($r) => $r->user && $r->user->role !== 'student')
            ->pluck('user_id')->unique()->values()->toArray();

        $studentAtts = StudentAttendance::whereIn('student_id', $studentUserIds)
            ->where('attendance_date', $today)
            ->get()->keyBy('student_id');
        $staffAtts = StaffAttendance::whereIn('user_id', $staffUserIds)
            ->where('attendance_date', $today)
            ->get()->keyBy('user_id');

        $result = $records->map(function ($record) use ($studentAtts, $staffAtts) {
            $status = 'In';
            if ($record->user) {
                $att = $record->user->role === 'student'
                    ? ($studentAtts[$record->user_id] ?? null)
                    : ($staffAtts[$record->user_id] ?? null);
                if ($att && $att->exit_time && $record->attendance_time >= $att->exit_time) {
                    $status = 'Out';
                }
            }
            return [
                'id' => $record->id,
                'user_id' => $record->user_id,
                'user' => $record->user,
                'attendance_date' => $record->attendance_date,
                'attendance_time' => $record->attendance_time,
                'method' => $record->method,
                'status' => $status,
                'created_at' => $record->created_at,
            ];
        });

        return $this->success($result, 'Records fetched successfully');
    }

    public function getUsers(Request $request): JsonResponse
    {
        $role = $request->query('role');
        $search = $request->query('search');

        $query = User::query()->select(
            'id', 'name', 'email', 'role', 'avatar',
            'admission_no', 'staff_id', 'roll_no',
            'face_descriptor', 'qr_code', 'nfc_uid'
        );

        if ($role) {
            $query->where('role', $role);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('admission_no', 'like', "%{$search}%")
                  ->orWhere('staff_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name', 'asc')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'admission_no' => $user->admission_no,
                'staff_id' => $user->staff_id,
                'roll_no' => $user->roll_no,
                'has_face' => !is_null($user->face_descriptor),
                'has_qr' => !is_null($user->qr_code),
                'has_nfc' => !is_null($user->nfc_uid),
                'qr_code' => $user->qr_code,
                'nfc_uid' => $user->nfc_uid,
            ];
        });

        return $this->success($users, 'Users fetched successfully');
    }

    public function generateQrCode(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->qr_code = Str::uuid()->toString();
        $user->save();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'qr_code' => $user->qr_code,
        ], 'QR code generated successfully');
    }

    public function deleteQrCode(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->qr_code = null;
        $user->save();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
        ], 'QR code deleted successfully');
    }

    public function assignNfcTag(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'nfc_uid' => 'required|string|max:64|unique:users,nfc_uid',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->nfc_uid = $request->nfc_uid;
        $user->save();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'nfc_uid' => $user->nfc_uid,
        ], 'NFC tag assigned successfully');
    }

    public function removeNfcTag(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->nfc_uid = null;
        $user->save();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
        ], 'NFC tag removed successfully');
    }

    public function lookupByQr(Request $request): JsonResponse
    {
        $request->validate([
            'qr_code' => 'required|string',
        ]);

        $user = User::where('qr_code', $request->qr_code)->first();

        if (!$user) {
            return $this->error('User not found for this QR code', 404);
        }

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'avatar' => $user->avatar,
        ], 'User found');
    }

    public function lookupByNfc(Request $request): JsonResponse
    {
        $request->validate([
            'nfc_uid' => 'required|string',
        ]);

        $user = User::where('nfc_uid', $request->nfc_uid)->first();

        if (!$user) {
            return $this->error('User not found for this NFC tag', 404);
        }

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'avatar' => $user->avatar,
        ], 'User found');
    }
}
