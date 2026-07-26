<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\StudentAttendance;
use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\StaffAttendance;

class AttendanceReportController extends BaseController
{
    public function studentAttendanceReport(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
            'month' => 'required',
            'year' => 'required',
        ]);

        $month = $request->month;
        $year = $request->year;
        
        // Convert month name to number if needed, but assuming month number for now or string
        // If it's a string like "feb", we should handle it.
        $monthMap = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'may' => 5, 'jun' => 6,
            'jul' => 7, 'aug' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12
        ];

        $monthNum = is_numeric($month) ? (int)$month : ($monthMap[strtolower($month)] ?? Carbon::now()->month);
        $startDate = Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $students = User::where('role', 'Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->with(['attendances' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('attendance_date', [$startDate, $endDate]);
            }])
            ->get();

        $reportData = $students->map(function ($student) use ($startDate, $endDate) {
            $attendances = $student->attendances;
            
            $counts = [
                'present' => 0,
                'late' => 0,
                'absent' => 0,
                'holiday' => 0,
                'half_day' => 0,
            ];

            $grid = [];
            $current = $startDate->copy();
            while ($current <= $endDate) {
                $dateStr = $current->toDateString();
                $attendance = $attendances->firstWhere('attendance_date', $current->format('Y-m-d'));
                
                $type = $attendance ? strtolower($attendance->attendance) : null;
                if ($type && isset($counts[$type])) {
                    $counts[$type]++;
                }
                
                $grid[] = $type ? strtoupper(substr($type, 0, 1)) : '-';
                $current->addDay();
            }

            $totalDays = $startDate->diffInDays($endDate) + 1;
            $presentDays = $counts['present'] + ($counts['half_day'] * 0.5) + $counts['late']; // Simplified calculation
            $percentage = $totalDays > 0 ? ($presentDays / $totalDays) * 100 : 0;

            return [
                'id' => $student->id,
                'name' => $student->name,
                'admission_no' => $student->admission_no,
                'roll_no' => $student->roll_no,
                'percentage' => number_format($percentage, 2),
                'p' => $counts['present'],
                'l' => $counts['late'],
                'a' => $counts['absent'],
                'h' => $counts['holiday'],
                'f' => $counts['half_day'],
                'grid' => $grid
            ];
        });

        return $this->success($reportData, 'Attendance report retrieved successfully');
    }

    public function studentDayWiseReport(Request $request): JsonResponse
    {
        // If date and class are provided, return detailed report like staff
        if ($request->has('date') && $request->has('school_class_id')) {
            return $this->studentDayWiseDetailReport($request);
        }

        $request->validate([
            'school_class_id' => 'required',
            'attendance_type' => 'required',
            'search_type' => 'required',
        ]);

        $startDate = Carbon::now();
        $endDate = Carbon::now();

        switch ($request->search_type) {
            case 'today':
                $startDate = Carbon::today();
                $endDate = Carbon::today();
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
        }

        $typeMap = [
            'P' => 'Present',
            'L' => 'Late',
            'A' => 'Absent',
            'H' => 'Holiday',
            'F' => 'Half Day'
        ];

        $attendanceType = $typeMap[$request->attendance_type] ?? $request->attendance_type;

        $query = User::where('role', 'Student')
            ->where('school_class_id', $request->school_class_id);

        if ($request->section_id && $request->section_id !== 'all') {
            $query->where('section_id', $request->section_id);
        }

        $students = $query->with(['schoolClass', 'section'])
            ->withCount(['attendances as count' => function ($query) use ($startDate, $endDate, $attendanceType) {
                $query->whereBetween('attendance_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->where('attendance', 'like', '%' . $attendanceType . '%');
            }])
            ->get();

        $reportData = $students->map(function ($student) {
            return [
                'admission_no' => $student->admission_no,
                'student_name' => $student->name,
                'class' => ($student->schoolClass->name ?? '-') . ' (' . ($student->section->name ?? '-') . ')',
                'father_name' => $student->father_name,
                'dob' => $student->dob ? $student->dob->format('d/m/Y') : '-',
                'admission_date' => $student->admission_date ? $student->admission_date->format('d/m/Y') : '-',
                'gender' => $student->gender,
                'mobile_number' => $student->phone,
                'count' => $student->count
            ];
        });

        return $this->success($reportData, 'Day wise attendance report retrieved successfully');
    }

    public function studentDayWiseDetailReport(Request $request): JsonResponse
    {
        $classId = $request->school_class_id;
        $sectionId = $request->section_id;
        $date = $request->date ?? Carbon::now()->toDateString();
        $source = $request->source;

        $query = User::where('role', 'Student')
            ->where('school_class_id', $classId);

        if ($sectionId && $sectionId !== 'all') {
            $query->where('section_id', $sectionId);
        }

        $query->with(['attendances' => function($q) use ($date) {
            $q->whereDate('attendance_date', $date);
        }]);

        if ($source && $source !== 'All') {
            $query->whereHas('attendances', function($q) use ($source, $date) {
                $q->whereDate('attendance_date', $date)->where('source', $source);
            });
        }

        $users = $query->get();

        $data = $users->map(function($user) use ($date) {
            $attendance = $user->attendances->first();
            return [
                'admission_no' => $user->admission_no,
                'roll_no' => $user->roll_no,
                'name' => $user->name,
                'attendance' => $attendance ? strtolower($attendance->attendance) : 'absent',
                'date' => Carbon::parse($date)->format('d/m/Y'),
                'source' => $attendance->source ?? 'Manual',
                'ip_address' => $attendance->ip_address ?? '',
                'agent' => $attendance->user_agent ?? '',
                'scan_location' => $attendance->location ?? '',
            ];
        });

        return $this->success($data, 'Student day wise detailed report retrieved successfully');
    }

    public function dailyAttendanceReport(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required',
        ]);

        $date = Carbon::parse($request->date)->toDateString();

        $classes = SchoolClass::with('sections')->get();

        $reportData = [];

        foreach ($classes as $class) {
            foreach ($class->sections as $section) {
                $students = User::where('role', 'Student')
                    ->where('school_class_id', $class->id)
                    ->where('section_id', $section->id)
                    ->get();

                $totalStudents = $students->count();
                if ($totalStudents === 0) continue;

                $studentIds = $students->pluck('id');

                $attendances = StudentAttendance::where('attendance_date', $date)
                    ->whereIn('student_id', $studentIds)
                    ->get();

                $presentStatuses = ['Present', 'Late', 'Half Day'];
                
                $presentIds = $attendances->filter(function($att) use ($presentStatuses) {
                    return in_array($att->attendance, $presentStatuses);
                })->pluck('student_id');

                $absentIds = $attendances->filter(function($att) {
                    return $att->attendance === 'Absent';
                })->pluck('student_id');

                $totalPresent = $presentIds->count();
                $malePresent = User::whereIn('id', $presentIds)->where('gender', 'Male')->count();
                $femalePresent = User::whereIn('id', $presentIds)->where('gender', 'Female')->count();

                $totalAbsent = $absentIds->count();
                $maleAbsent = User::whereIn('id', $absentIds)->where('gender', 'Male')->count();
                $femaleAbsent = User::whereIn('id', $absentIds)->where('gender', 'Female')->count();

                $presentPercentage = $totalStudents > 0 ? ($totalPresent / $totalStudents) * 100 : 0;
                $absentPercentage = $totalStudents > 0 ? ($totalAbsent / $totalStudents) * 100 : 0;

                $reportData[] = [
                    'class_section' => $class->name . ' (' . $section->name . ')',
                    'total_present' => $totalPresent,
                    'male_present' => $malePresent,
                    'female_present' => $femalePresent,
                    'total_absent' => $totalAbsent,
                    'male_absent' => $maleAbsent,
                    'female_absent' => $femaleAbsent,
                    'present_percentage' => number_format($presentPercentage, 0) . '%',
                    'absent_percentage' => number_format($absentPercentage, 0) . '%',
                ];
            }
        }

        return $this->success($reportData, 'Daily attendance report retrieved successfully');
    }

    public function staffDayWiseReport(Request $request): JsonResponse
    {
        $role = $request->role;
        $date = $request->date ?? Carbon::now()->toDateString();
        $source = $request->source; // 'Manual', 'Device', etc.

        $query = User::where('role', $role)
            ->with(['staffAttendances' => function($q) use ($date) {
                $q->whereDate('attendance_date', $date);
            }]);

        if ($source && $source !== 'All') {
            $query->whereHas('staffAttendances', function($q) use ($source, $date) {
                $q->whereDate('attendance_date', $date)->where('source', $source);
            });
        }

        $users = $query->get();

        $data = $users->map(function($user) use ($date) {
            $attendance = $user->staffAttendances->first();
            return [
                'staff_id' => $user->staff_id,
                'name' => $user->name,
                'role' => $user->role,
                'attendance' => $attendance ? $attendance->attendance : 'absent',
                'date' => Carbon::parse($date)->format('d/m/Y'),
                'source' => $attendance->source ?? 'Manual',
                'ip_address' => $attendance->ip_address ?? '',
                'agent' => $attendance->user_agent ?? '',
                'scan_location' => $attendance->location ?? '',
            ];
        });

        return $this->success($data, 'Staff day wise attendance report retrieved successfully');
    }

    public function staffAttendanceReport(Request $request): JsonResponse
    {
        $request->validate([
            'role' => 'required',
            'month' => 'required',
            'year' => 'required',
        ]);

        $month = $request->month;
        $year = $request->year;
        
        $monthMap = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'may' => 5, 'jun' => 6,
            'jul' => 7, 'aug' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12
        ];

        $monthNum = is_numeric($month) ? (int)$month : ($monthMap[strtolower($month)] ?? Carbon::now()->month);
        $startDate = Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $staff = User::where('role', $request->role)
            ->with(['staffAttendances' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('attendance_date', [$startDate, $endDate]);
            }])
            ->get();

        $reportData = $staff->map(function ($s) use ($startDate, $endDate) {
            $attendances = $s->staffAttendances;
            
            $counts = [
                'present' => 0,
                'late' => 0,
                'absent' => 0,
                'holiday' => 0,
                'half_day' => 0,
            ];

            $grid = [];
            $current = $startDate->copy();
            while ($current <= $endDate) {
                $attendance = $attendances->firstWhere('attendance_date', $current->format('Y-m-d'));
                
                $type = $attendance ? strtolower($attendance->attendance) : null;
                if ($type && isset($counts[$type])) {
                    $counts[$type]++;
                }
                
                $grid[] = $type ? strtoupper(substr($type, 0, 1)) : '-';
                $current->addDay();
            }

            $totalDays = $startDate->diffInDays($endDate) + 1;
            $presentDays = $counts['present'] + ($counts['half_day'] * 0.5) + $counts['late'];
            $percentage = $totalDays > 0 ? ($presentDays / $totalDays) * 100 : 0;

            return [
                'staff_id' => $s->staff_id,
                'name' => $s->name,
                'role' => $s->role,
                'designation' => $s->designation,
                'percentage' => number_format($percentage, 2),
                'p' => $counts['present'],
                'l' => $counts['late'],
                'a' => $counts['absent'],
                'h' => $counts['holiday'],
                'f' => $counts['half_day'],
                'grid' => $grid
            ];
        });

        return $this->success($reportData, 'Staff attendance report retrieved successfully');
    }

    public function biometricAttendanceLog(Request $request): JsonResponse
    {
        $date = $request->date ?? Carbon::now()->toDateString();
        
        $attendances = StudentAttendance::whereDate('attendance_date', $date)
            ->where('source', 'Device')
            ->with('student:id,name,admission_no')
            ->get();

        $data = $attendances->map(function($att) {
            return [
                'admission_no' => $att->student->admission_no ?? '-',
                'student_name' => $att->student->name ?? '-',
                'punch_in' => $att->entry_time ? Carbon::parse($att->entry_time)->format('h:i A') : '-',
                'device_serial' => $att->device_serial ?? '-',
                'ip_address' => $att->ip_address ?? '-',
            ];
        });

        return $this->success($data, 'Biometric attendance log retrieved successfully');
    }
}
