<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ZktecoDevice;
use App\Models\ZktecoAttendanceLog;
use App\Models\StudentAttendance;
use App\Models\User;
use Carbon\Carbon;

class ZktecoDeviceController extends Controller
{
    /**
     * Get all registered ZKTeco devices
     */
    public function index(Request $request)
    {
        $devices = ZktecoDevice::with(['schoolClass', 'section'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($device) {
                // Determine online status based on push within last 15 mins
                $isRecent = $device->last_push_at && $device->last_push_at->gt(now()->subMinutes(15));
                $device->is_online = $isRecent || $device->status === 'online';
                return $device;
            });

        return response()->json([
            'success' => true,
            'data' => $devices
        ]);
    }

    /**
     * Store new ZKTeco device
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'serial_number' => 'required|string|max:255|unique:zkteco_devices,serial_number',
            'ip_address' => 'nullable|string|max:45',
            'port' => 'nullable|integer',
            'location' => 'nullable|string|max:255',
            'device_type' => 'nullable|string|max:50',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'notes' => 'nullable|string',
        ]);

        $device = ZktecoDevice::create([
            'name' => $validated['name'],
            'serial_number' => trim($validated['serial_number']),
            'ip_address' => $validated['ip_address'] ?? null,
            'port' => $validated['port'] ?? 4370,
            'location' => $validated['location'] ?? null,
            'device_type' => $validated['device_type'] ?? 'adms_push',
            'school_class_id' => $validated['school_class_id'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
            'status' => 'offline',
            'notes' => $validated['notes'] ?? null,
        ]);

        $device->load(['schoolClass', 'section']);

        return response()->json([
            'success' => true,
            'message' => 'ZKTeco Device registered successfully',
            'data' => $device
        ], 201);
    }

    /**
     * Update ZKTeco device
     */
    public function update(Request $request, $id)
    {
        $device = ZktecoDevice::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'serial_number' => 'required|string|max:255|unique:zkteco_devices,serial_number,' . $id,
            'ip_address' => 'nullable|string|max:45',
            'port' => 'nullable|integer',
            'location' => 'nullable|string|max:255',
            'device_type' => 'nullable|string|max:50',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'status' => 'nullable|in:online,offline,disabled',
            'notes' => 'nullable|string',
        ]);

        $device->update($validated);
        $device->load(['schoolClass', 'section']);

        return response()->json([
            'success' => true,
            'message' => 'ZKTeco Device updated successfully',
            'data' => $device
        ]);
    }

    /**
     * Delete ZKTeco device
     */
    public function destroy($id)
    {
        $device = ZktecoDevice::findOrFail($id);
        $device->delete();

        return response()->json([
            'success' => true,
            'message' => 'ZKTeco Device deleted successfully'
        ]);
    }

    /**
     * Trigger log pull & processing for device
     */
    public function pullLogs(Request $request, $id)
    {
        $device = ZktecoDevice::findOrFail($id);

        // Update push timestamp & status
        $device->update([
            'last_push_at' => now(),
            'status' => 'online'
        ]);

        // Reprocess unmatched logs for this device
        $unmatchedLogs = ZktecoAttendanceLog::where('device_serial', $device->serial_number)
            ->where('status', 'unmatched')
            ->get();

        $reprocessedCount = 0;
        foreach ($unmatchedLogs as $log) {
            $user = User::where('roll_no', $log->user_pin)
                ->orWhere('admission_no', $log->user_pin)
                ->orWhere('nfc_uid', $log->user_pin)
                ->orWhere('qr_code', $log->user_pin)
                ->orWhere('staff_id', $log->user_pin)
                ->orWhere('id', $log->user_pin)
                ->first();

            if ($user) {
                $punchTime = Carbon::parse($log->punch_time);
                $today = $punchTime->toDateString();
                $currentTime = $punchTime->toTimeString();

                if (strtolower($user->role) === 'student') {
                    $attendance = StudentAttendance::where('student_id', $user->id)
                        ->where('attendance_date', $today)
                        ->first();

                    if (!$attendance) {
                        StudentAttendance::create([
                            'student_id' => $user->id,
                            'attendance_date' => $today,
                            'attendance' => 'present',
                            'entry_time' => $currentTime,
                            'source' => 'ZKTeco Fingerprint/NFC (Pulled)',
                            'device_serial' => $device->serial_number
                        ]);
                    }
                }

                $log->update([
                    'student_id' => $user->id,
                    'school_class_id' => $user->school_class_id ?: $device->school_class_id,
                    'section_id' => $user->section_id ?: $device->section_id,
                    'status' => 'matched'
                ]);

                $reprocessedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "ZKTeco data pulled successfully. $reprocessedCount log(s) matched.",
            'data' => [
                'device' => $device,
                'reprocessed_count' => $reprocessedCount
            ]
        ]);
    }

    /**
     * Get ZKTeco Attendance Logs for live feed & reporting
     */
    public function getLogs(Request $request)
    {
        $query = ZktecoAttendanceLog::with(['student', 'schoolClass', 'section', 'device'])
            ->orderBy('id', 'desc');

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('device_serial')) {
            $query->where('device_serial', $request->device_serial);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('punch_time', $request->date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('user_pin', 'like', "%{$search}%")
                  ->orWhere('device_serial', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                        ->orWhere('admission_no', 'like', "%{$search}%")
                        ->orWhere('roll_no', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'total' => $logs->total(),
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
        ]);
    }

    /**
     * Get system summary metrics
     */
    public function getSummary(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $totalDevices = ZktecoDevice::count();
        $onlineDevices = ZktecoDevice::where('last_push_at', '>=', now()->subMinutes(15))->count();
        $todayPunches = ZktecoAttendanceLog::whereDate('punch_time', $today)->count();
        $matchedPunches = ZktecoAttendanceLog::whereDate('punch_time', $today)->where('status', 'matched')->count();

        $matchRate = $todayPunches > 0 ? round(($matchedPunches / $todayPunches) * 100, 1) : 100;

        return response()->json([
            'success' => true,
            'data' => [
                'total_devices' => $totalDevices,
                'online_devices' => $onlineDevices,
                'today_punches' => $todayPunches,
                'matched_punches' => $matchedPunches,
                'match_rate' => $matchRate,
            ]
        ]);
    }
}
