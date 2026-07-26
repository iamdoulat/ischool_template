<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserPortalController extends BaseController
{
    /**
     * Get user dashboard data.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $settings = GeneralSetting::first();

        // Profile summary
        $profile = [
            'name' => $user->name . ($user->last_name ? ' ' . $user->last_name : ''),
            'attendance_percentage' => $this->getStudentAttendancePercentage($user),
            'minimum_attendance' => $settings->low_attendance_limit ?? 75.00,
            'barcode' => $user->admission_no ?? $user->staff_id ?? $user->id,
            'image' => $user->avatar ? url('storage/' . $user->avatar) : null,
        ];

        // Notices
        $notices = DB::table('notices')
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('publish_date')
                    ->orWhere('publish_date', '<=', now())
                    ->orWhereNull('notice_date')
                    ->orWhere('notice_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->latest('notice_date')->limit(4)->get(['id', 'title', 'message', 'notice_date as date'])
            ->map(fn($n) => [
                'id' => $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'date' => $n->date ? date('m/d/Y', strtotime($n->date)) : date('m/d/Y'),
            ]);

        // Subject Progress
        $subjectProgress = [];
        $examResults = DB::table('exam_results')
            ->join('exam_schedules', function ($join) {
                $join->on('exam_results.exam_id', '=', 'exam_schedules.exam_id')
                     ->on('exam_results.subject_id', '=', 'exam_schedules.subject_id');
            })
            ->join('subjects', 'exam_results.subject_id', '=', 'subjects.id')
            ->where('exam_results.student_id', $user->id)
            ->select('exam_results.id', 'subjects.name as subject', 'subjects.code', 'exam_results.marks', 'exam_results.is_absent', 'exam_schedules.max_marks as total_marks')
            ->get();
        foreach ($examResults as $result) {
            $marks = $result->is_absent ? 0 : (float) $result->marks;
            $progress = $result->total_marks > 0 ? round(($marks / $result->total_marks) * 100) : 0;
            $subjectProgress[] = [
                'id' => $result->id,
                'subject' => $result->code ? $result->subject . ' (' . $result->code . ')' : $result->subject,
                'progress' => $progress,
            ];
        }

        // Upcoming Classes / Timetable
        $upcomingClasses = [];
        $dayOrder = "FIELD(class_timetables.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
        $timetable = DB::table('class_timetables')
            ->join('subjects', 'class_timetables.subject_id', '=', 'subjects.id')
            ->join('users', 'class_timetables.staff_id', '=', 'users.id')
            ->where('class_timetables.school_class_id', $user->school_class_id)
            ->where('class_timetables.section_id', $user->section_id)
            ->select(
                'class_timetables.id',
                'users.name as teacher',
                'users.staff_id as code',
                'subjects.name as subject',
                'subjects.code as subject_code',
                'class_timetables.start_time',
                'class_timetables.end_time',
                'class_timetables.room'
            )
            ->orderByRaw($dayOrder)
            ->orderBy('class_timetables.start_time')
            ->limit(8)
            ->get();
        foreach ($timetable as $t) {
            $upcomingClasses[] = [
                'id' => $t->id,
                'teacher' => $t->teacher,
                'code' => $t->code ?? '',
                'subject' => $t->subject_code ? $t->subject . ' (' . $t->subject_code . ')' : $t->subject,
                'room' => $t->room ?? 'N/A',
                'time' => trim(($t->start_time ?? '') . '-' . ($t->end_time ?? ''), '-'),
            ];
        }

        // Homework
        $homework = [];
        $assignments = DB::table('homeworks')
            ->join('subjects', 'homeworks.subject_id', '=', 'subjects.id')
            ->where('homeworks.class_id', $user->school_class_id)
            ->where(function ($q) use ($user) {
                $q->whereNull('homeworks.section_id')
                    ->orWhere('homeworks.section_id', $user->section_id);
            })
            ->select('homeworks.id', 'subjects.name as subject', 'subjects.code', 'homeworks.homework_date', 'homeworks.submission_date', 'homeworks.evaluation_date')
            ->latest('homeworks.created_at')->limit(5)->get();
        foreach ($assignments as $a) {
            $status = $a->evaluation_date ? 'Submitted' : 'Pending';
            $homework[] = [
                'id' => $a->id,
                'subject' => $a->code ? $a->subject . ' (' . $a->code . ')' : $a->subject,
                'date' => $a->homework_date ? date('m/d/Y', strtotime($a->homework_date)) : '',
                'submission' => $a->submission_date ? date('m/d/Y', strtotime($a->submission_date)) : '',
                'status' => $status,
            ];
        }

        // Teachers — class teachers first, then unique subject teachers from timetable
        $teachers = [];
        $classTeacherIds = [];

        $classTeachers = DB::table('class_teachers')
            ->join('users', 'class_teachers.staff_id', '=', 'users.id')
            ->where('class_teachers.school_class_id', $user->school_class_id)
            ->where('class_teachers.section_id', $user->section_id)
            ->select('users.id', 'users.name', 'users.staff_id as code')
            ->get();
        foreach ($classTeachers as $t) {
            $classTeacherIds[] = $t->id;
            $teachers[] = [
                'id' => $t->id,
                'name' => $t->name,
                'code' => $t->code ?? '',
                'isClassTeacher' => true,
            ];
        }

        $subjectTeachers = DB::table('class_timetables')
            ->join('users', 'class_timetables.staff_id', '=', 'users.id')
            ->where('class_timetables.school_class_id', $user->school_class_id)
            ->where('class_timetables.section_id', $user->section_id)
            ->select('users.id', 'users.name', 'users.staff_id as code')
            ->distinct()
            ->get();
        foreach ($subjectTeachers as $t) {
            if (!in_array($t->id, $classTeacherIds)) {
                $teachers[] = [
                    'id' => $t->id,
                    'name' => $t->name,
                    'code' => $t->code ?? '',
                    'isClassTeacher' => false,
                ];
            }
        }

        $data = [
            'profile' => $profile,
            'notices' => $notices,
            'subjectProgress' => $subjectProgress,
            'upcomingClasses' => $upcomingClasses,
            'homework' => $homework,
            'teachers' => $teachers,
            'visitors' => $this->getVisitors(),
            'libraryBooks' => $this->getLibraryBooks($user),
            // Per-role card visibility, controlled from
            // system-setting/student-profile-setting (Dashboard Setting tab).
            'widgets' => $this->getDashboardWidgetVisibility($user->role),
        ];

        return $this->success($data, 'User dashboard data retrieved successfully');
    }

    /**
     * Build the map of dashboard card -> visible (bool) for the given portal
     * role, from the DashboardSetting toggles. Keys are stable slugs the
     * portal dashboard uses to show/hide each card.
     */
    private function getDashboardWidgetVisibility(string $role): array
    {
        $column = $role === 'Parent' ? 'parent' : 'student';

        $settings = DB::table('dashboard_settings')->get(['name', $column]);

        $map = [];
        foreach ($settings as $s) {
            // "Notice Board" -> "notice_board", "Upcoming Class" -> "upcoming_class"
            $key = preg_replace('/[^a-z0-9]+/', '_', strtolower($s->name));
            $key = trim($key, '_');
            $map[$key] = (bool) $s->{$column};
        }

        return $map;
    }

    /**
     * Zoom live classes for the student's class/section.
     */
    public function zoomLiveClasses(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = DB::table('live_classes')
            ->leftJoin('users', 'live_classes.staff_id', '=', 'users.id')
            ->leftJoin('school_classes', 'live_classes.class_id', '=', 'school_classes.id')
            ->leftJoin('sections', 'live_classes.section_id', '=', 'sections.id')
            ->where('live_classes.class_id', $user->school_class_id);

        if ($user->section_id) {
            $query->where('live_classes.section_id', $user->section_id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('live_classes.title', 'like', "%{$search}%")
                    ->orWhere('live_classes.description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page') ?: 50);

        $paginated = $query
            ->orderByDesc('live_classes.date_time')
            ->select(
                'live_classes.id',
                'live_classes.title',
                'live_classes.description',
                'live_classes.date_time',
                'live_classes.duration',
                'live_classes.status',
                'live_classes.join_url',
                'users.name as host_name',
                'users.last_name as host_last_name',
                'users.role as host_role',
                'users.staff_id as host_code',
                'school_classes.name as class_name',
                'sections.name as section_name'
            )
            ->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($c) {
            $host = trim(($c->host_name ?? '') . ' ' . ($c->host_last_name ?? ''));
            $role = $c->host_role ? ucfirst(strtolower($c->host_role)) : 'Teacher';
            if ($c->host_code) {
                $host .= " ({$role} : {$c->host_code})";
            }
            $classLabel = $c->class_name ?? '';
            if ($c->section_name) {
                $classLabel .= " ({$c->section_name})";
            }

            return [
                'id' => $c->id,
                'title' => $c->title,
                'description' => $c->description ?? '',
                'date_time' => $c->date_time ? date('m/d/Y H:i:s', strtotime($c->date_time)) : '',
                'duration' => (int) $c->duration,
                'class' => $classLabel,
                'host' => $host,
                'status' => ucfirst(strtolower($c->status ?? '')),
                'join_url' => $c->join_url ?? '',
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'Live classes retrieved successfully');
    }

    /**
     * Get user profile data for student/parent portal.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $user->load(['schoolClass', 'section', 'studentCategory']);

        $classSection = ($user->schoolClass->name ?? 'N/A') . ' (' . ($user->academicSession->name ?? date('Y')) . ')';
        if ($user->section) {
            $classSection .= ' - ' . $user->section->name;
        }

        $basic = [
            'name' => $user->name . ($user->last_name ? ' ' . $user->last_name : ''),
            'admissionNo' => $user->admission_no ?? '',
            'rollNumber' => $user->roll_no ?? '',
            'image' => $user->avatar ? url('storage/' . $user->avatar) : null,
            'class' => $classSection,
            'section' => $user->section->name ?? '',
            'gender' => $user->gender ?? '',
            'rte' => $user->rte ?? 'No',
            'barcode' => $user->admission_no ?? '',
            'qrCode' => 'qr-' . ($user->admission_no ?? $user->id),
            'behaviourScore' => '0',
        ];

        $profileTab = [
            'basicDetails' => [
                'admissionDate'   => $user->admission_date ? date('m/d/Y', strtotime($user->admission_date)) : '',
                'dateOfBirth'     => $user->dob ? date('m/d/Y', strtotime($user->dob)) : '',
                'category'        => $user->studentCategory->category_name ?? '',
                'mobileNumber'    => $user->phone ?? '',
                'caste'           => $user->caste ?? '',
                'religion'        => $user->religion ?? '',
                'email'           => $user->email ?? '',
                'note'            => $user->note ?? '',
                'username'        => $user->username ?? '',
                'parentUsername'  => $user->parent_username ?? '',
                'birthPlace'      => $user->birth_place ?? '',
                'state'           => $user->state ?? '',
                'nationality'     => $user->nationality ?? '',
                'motherTongue'    => $user->mother_tongue ?? '',
                'secondLanguage'  => $user->second_language ?? '',
            ],
            'addressDetails' => [
                'currentAddress'   => $user->current_address ?? '',
                'permanentAddress' => $user->permanent_address ?? '',
                'postalCode'       => $user->postal_code ?? '',
            ],
            'parentGuardianDetails' => [
                'father' => [
                    'name' => $user->father_name ?? '',
                    'phone' => $user->father_phone ?? '',
                    'occupation' => $user->father_occupation ?? '',
                    'image' => $user->father_photo ? url('storage/' . $user->father_photo) : null,
                ],
                'mother' => [
                    'name' => $user->mother_name ?? '',
                    'phone' => $user->mother_phone ?? '',
                    'occupation' => $user->mother_occupation ?? '',
                    'image' => $user->mother_photo ? url('storage/' . $user->mother_photo) : null,
                ],
                'guardian' => [
                    'name' => $user->guardian_name ?? '',
                    'email' => $user->guardian_email ?? '',
                    'relation' => $user->guardian_relation ?? '',
                    'phone' => $user->guardian_phone ?? '',
                    'occupation' => $user->guardian_occupation ?? '',
                    'address' => $user->guardian_address ?? '',
                    'image' => $user->guardian_photo ? url('storage/' . $user->guardian_photo) : null,
                ],
            ],
            'transportDetails' => [],
            'hostelDetails' => [],
            'miscellaneousDetails' => [
                'medicalHistory'              => $user->medical_history ?? '',
                'bloodGroup'                  => $user->blood_group ?? '',
                'house'                       => $user->house ?? '',
                'height'                      => $user->height ?? '',
                'weight'                      => $user->weight ?? '',
                'measurementDate'             => $user->measurement_date ? date('m/d/Y', strtotime($user->measurement_date)) : '',
                'previousSchoolDetails'       => $user->previous_school_details ?? '',
                'nationalIdentificationNumber'=> $user->national_identification_no ?? '',
                'bankAccountNumber'           => $user->bank_account_no ?? '',
                'bankName'                    => $user->bank_name ?? '',
                'ifscCode'                    => $user->ifsc_code ?? '',
                'identificationMarks'         => $user->identification_marks ?? '',
                'appraisalAchievements'       => $user->appraisal_achievements ?? '',
                'generalBehaviour'            => $user->general_behaviour ?? '',
            ],
            'previousAcademicRecord' => collect($user->previous_academic_record ?? [])->map(function ($rec) {
                return [
                    'schoolName' => $rec['school_name'] ?? '',
                    'class'      => $rec['class'] ?? '',
                    'year'       => $rec['year'] ?? '',
                    'percentage' => $rec['percentage'] ?? '',
                ];
            })->values()->toArray(),
        ];

        // Load transport assignment
        if ($user->relationLoaded('transportAssignment') || true) {
            $transport = DB::table('student_transport_assignments')
                ->leftJoin('transport_routes', 'student_transport_assignments.route_id', '=', 'transport_routes.id')
                ->leftJoin('transport_vehicles', 'student_transport_assignments.vehicle_id', '=', 'transport_vehicles.id')
                ->leftJoin('transport_pickup_points', 'student_transport_assignments.pickup_point_id', '=', 'transport_pickup_points.id')
                ->where('student_transport_assignments.student_id', $user->id)
                ->select(
                    'transport_pickup_points.name as pickup_point',
                    'transport_routes.title as route',
                    'transport_vehicles.vehicle_no as vehicle_number',
                    'transport_vehicles.driver_name',
                    'transport_vehicles.driver_contact'
                )->first();
            if ($transport) {
                $profileTab['transportDetails'] = [
                    'pickupPoint' => $transport->pickup_point ?? '',
                    'route' => $transport->route ?? '',
                    'vehicleNumber' => $transport->vehicle_number ?? '',
                    'driverName' => $transport->driver_name ?? '',
                    'driverContact' => $transport->driver_contact ?? '',
                ];
            }
        }

        // Load hostel details
        $hostel = DB::table('users')
            ->leftJoin('hostels', 'users.hostel_id', '=', 'hostels.id')
            ->leftJoin('rooms', 'users.room_id', '=', 'rooms.id')
            ->leftJoin('room_types', 'rooms.room_type_id', '=', 'room_types.id')
            ->where('users.id', $user->id)
            ->select('hostels.name as hostel', 'rooms.room_number as room_no', 'room_types.name as room_type')
            ->first();
        if ($hostel) {
            $profileTab['hostelDetails'] = [
                'hostel' => $hostel->hostel ?? '',
                'roomNo' => $hostel->room_no ?? '',
                'roomType' => $hostel->room_type ?? '',
            ];
        }

        // Active custom fields configured for students (system-setting/custom-fields).
        $customFields = \App\Models\CustomField::where('belongs_to', 'student')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($field) {
                return [
                    'id' => $field->id,
                    'name' => $field->name,
                    'type' => $field->field_type,
                    'value' => '',
                ];
            })->values();

        $data = [
            'basic' => $basic,
            'profileTab' => $profileTab,
            'customFields' => $customFields,
        ];

        return $this->success($data, 'User profile retrieved successfully');
    }

    /**
     * Get the authenticated student's fee details with payment history.
     */
    public function studentFees(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        // Sync fee masters from the student's fee groups (same logic as admin)
        $feeGroups = $user->feesGroups ?? collect();
        if ($feeGroups && $feeGroups->count() > 0) {
            $masters = \App\Models\FeeMaster::whereIn('fee_group_id', $feeGroups->pluck('id'))->get();
            foreach ($masters as $master) {
                \App\Models\StudentFeeMaster::firstOrCreate(
                    ['student_id' => $user->id, 'fee_master_id' => $master->id],
                    ['academic_session_id' => $user->academic_session_id, 'is_active' => true]
                );
            }
        }

        $fees = \App\Models\StudentFeeMaster::with(['feeMaster.feeType', 'feeMaster.feeGroup', 'payments'])
            ->where('student_id', $user->id)
            ->get();

        // Always show the system's currently active session, not the one
        // stamped on the student record. Stale academic_session_id on a user
        // row (e.g. carried over from a previous year) would otherwise surface
        // an outdated session here.
        $session = DB::table('academic_sessions')->where('is_active', true)->value('session')
            ?? ($user->academic_session_id
                ? DB::table('academic_sessions')->where('id', $user->academic_session_id)->value('session')
                : null)
            ?? DB::table('academic_sessions')->latest('id')->value('session');

        $className = DB::table('school_classes')->where('id', $user->school_class_id)->value('name') ?? '';
        $sectionName = DB::table('sections')->where('id', $user->section_id)->value('name') ?? '';
        $categoryName = $user->category
            ? (DB::table('student_categories')->where('id', $user->category)->value('category_name') ?? '')
            : '';

        $feeRows = $fees->map(function ($sfm) {
            $master = $sfm->feeMaster;
            $total = (float) ($master->amount ?? 0);
            $fine = (float) ($master->fine_amount ?? 0);

            $paidAmount = $sfm->payments->sum(fn($p) => (float) $p->amount);
            $discountAmount = $sfm->payments->sum(fn($p) => (float) $p->discount);
            $fineAmount = $sfm->payments->sum(fn($p) => (float) $p->fine);
            $balance = max(0, $total - $paidAmount);

            if ($paidAmount <= 0) {
                $status = 'Unpaid';
            } elseif ($balance <= 0) {
                $status = 'Paid';
            } else {
                $status = 'Partial';
            }

            if ($status !== 'Paid') {
                $hasPending = DB::table('offline_bank_payments')
                    ->where('student_fee_master_id', $sfm->id)
                    ->where('status', 'pending')
                    ->exists();
                if ($hasPending) {
                    $status = 'Pending';
                }
            }

            return [
                'id' => $sfm->id,
                'name' => $master->feeType->name ?? 'Fee',
                'code' => $master->feeType->code ?? '',
                'due_date' => $master->due_date ? date('m/d/Y', strtotime($master->due_date)) : '',
                'status' => $status,
                'amount' => $total,
                'fine' => $fine,
                'discount' => $discountAmount,
                'fine_amount' => $fineAmount,
                'paid_amount' => $paidAmount,
                'balance' => $balance,
                'payments' => $sfm->payments->map(fn($p) => [
                    'id' => $p->id,
                    'payment_id' => $p->id . '/' . $sfm->id,
                    'mode' => $p->payment_mode,
                    'date' => $p->date ? date('m/d/Y', strtotime($p->date)) : '',
                    'discount' => (float) $p->discount,
                    'fine' => (float) $p->fine,
                    'paid' => (float) $p->amount,
                    'balance' => 0,
                    'note' => $p->note ?? '',
                ])->values(),
            ];
        })->values();

        return $this->success([
            'student' => [
                'name' => trim(($user->name ?? '') . ' ' . ($user->last_name ?? '')),
                'father_name' => $user->father_name ?? '',
                'mobile' => $user->phone ?? '',
                'category' => $categoryName,
                'class_section' => trim($className . ($sectionName ? ' (' . $sectionName . ')' : '')),
                'admission_no' => $user->admission_no ?? '',
                'roll_no' => $user->roll_no ?? '',
                'rte' => $user->rte ?? 'No',
                'photo' => $user->avatar ? url('storage/' . $user->avatar) : '',
            ],
            'session' => $session ?? '',
            'fees' => $feeRows,
        ], 'Student fees retrieved successfully');
    }

    /**
     * Get the weekly class timetable for the authenticated student's class/section,
     * grouped by day of week.
     */
    public function classTimetable(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return $this->error('Unauthorized', 401);
        }

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // Allow optional query params to override auto-detection (admin preview, etc.)
        $classId = $request->input('school_class_id', $user->school_class_id);
        $sectionId = $request->input('section_id', $user->section_id);

        $className = $classId
            ? DB::table('school_classes')->where('id', $classId)->value('name')
            : null;
        $sectionName = $sectionId
            ? DB::table('sections')->where('id', $sectionId)->value('name')
            : null;

        if (!$classId || !$sectionId) {
            return $this->success([
                'class_name' => $className,
                'section_name' => $sectionName,
                'timetable' => array_fill_keys($days, []),
            ], 'No class/section assigned.');
        }

        // Resolve the class/section to the active academic session so the
        // timetable matches what the admin scheduled regardless of which
        // session the student's user record points to.
        $activeSessionId = \App\Models\AcademicSession::where('is_active', true)->value('id');

        if ($activeSessionId && $className) {
            $resolvedClassId = DB::table('school_classes')
                ->where('name', $className)
                ->where('academic_session_id', $activeSessionId)
                ->value('id');
            if ($resolvedClassId) {
                $classId = $resolvedClassId;
            }
        }

        if ($activeSessionId && $sectionName && $classId) {
            $resolvedSectionId = DB::table('sections')
                ->where('name', $sectionName)
                ->where('school_class_id', $classId)
                ->where('academic_session_id', $activeSessionId)
                ->value('id');
            if ($resolvedSectionId) {
                $sectionId = $resolvedSectionId;
            }
        }

        // Query timetable entries — use DB::table (no model scope) since we
        // already resolved to the active session manually.
        $rows = DB::table('class_timetables')
            ->join('subjects', 'class_timetables.subject_id', '=', 'subjects.id')
            ->leftJoin('users', 'class_timetables.staff_id', '=', 'users.id')
            ->where('class_timetables.school_class_id', $classId)
            ->where('class_timetables.section_id', $sectionId)
            ->orderBy('class_timetables.start_time')
            ->get([
                'class_timetables.id',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'users.name as teacher_name',
                'users.staff_id as teacher_code',
                'class_timetables.day',
                'class_timetables.start_time',
                'class_timetables.end_time',
                'class_timetables.room',
            ]);

        $timetable = array_fill_keys($days, []);

        foreach ($rows as $r) {
            $day = ucfirst(strtolower($r->day));
            if (!array_key_exists($day, $timetable)) {
                $timetable[$day] = [];
            }
            $teacher = $r->teacher_name ?? '';
            if ($teacher && $r->teacher_code) {
                $teacher .= ' (' . $r->teacher_code . ')';
            }
            $timetable[$day][] = [
                'id' => $r->id,
                'subject' => $r->subject_code ? $r->subject_name . ' (' . $r->subject_code . ')' : $r->subject_name,
                'time' => trim(($r->start_time ?? '') . ' - ' . ($r->end_time ?? ''), ' -'),
                'teacher' => $teacher,
                'room' => $r->room ?? '',
            ];
        }

        return $this->success([
            'class_name' => $className,
            'section_name' => $sectionName,
            'timetable' => $timetable,
        ], 'Class timetable retrieved successfully');
    }

    /**
     * Get syllabus (lesson/topic) completion status for the student's class/section,
     * grouped subject -> lesson -> topic, with completion percentages.
     */
    public function syllabusStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $className = DB::table('school_classes')->where('id', $user->school_class_id)->value('name');
        $sectionName = DB::table('sections')->where('id', $user->section_id)->value('name');

        $query = DB::table('topics')->where('class_name', $className);
        if ($sectionName) {
            $query->where('section', $sectionName);
        }
        $topics = $query->orderBy('subject')->orderBy('lesson')->orderBy('id')->get();

        $bySubject = [];
        foreach ($topics as $t) {
            $bySubject[$t->subject][$t->lesson][] = $t;
        }

        $result = [];
        foreach ($bySubject as $subjectName => $lessons) {
            $subjTotal = 0;
            $subjDone = 0;
            $lessonList = [];

            foreach ($lessons as $lessonName => $lessonTopics) {
                $lTotal = count($lessonTopics);
                $lDone = 0;
                $topicList = [];
                foreach ($lessonTopics as $t) {
                    $done = (bool) $t->is_completed;
                    if ($done) $lDone++;
                    $topicList[] = [
                        'id' => $t->id,
                        'title' => $t->topic,
                        'is_completed' => $done,
                        'completion_date' => $t->completion_date ? date('m/d/Y', strtotime($t->completion_date)) : null,
                    ];
                }
                $subjTotal += $lTotal;
                $subjDone += $lDone;
                $lessonList[] = [
                    'title' => $lessonName,
                    'completion' => $lTotal > 0 ? (int) round(($lDone / $lTotal) * 100) : 0,
                    'topics' => $topicList,
                ];
            }

            $result[] = [
                'subject' => $subjectName,
                'completion' => $subjTotal > 0 ? (int) round(($subjDone / $subjTotal) * 100) : 0,
                'total_topics' => $subjTotal,
                'completed_topics' => $subjDone,
                'lessons' => $lessonList,
            ];
        }

        return $this->success($result, 'Syllabus status retrieved successfully');
    }

    /**
     * Get homework for the authenticated student's class/section.
     * upcoming = submission_date >= today, closed = submission_date < today.
     */
    public function homework(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $type = $request->query('type', 'upcoming'); // upcoming | closed

        $query = DB::table('homeworks')
            ->join('school_classes', 'homeworks.class_id', '=', 'school_classes.id')
            ->join('subjects', 'homeworks.subject_id', '=', 'subjects.id')
            ->leftJoin('sections', 'homeworks.section_id', '=', 'sections.id')
            ->leftJoin('users as creator', 'homeworks.created_by', '=', 'creator.id')
            ->where('homeworks.class_id', $user->school_class_id)
            ->where(function ($q) use ($user) {
                $q->whereNull('homeworks.section_id')
                  ->orWhere('homeworks.section_id', $user->section_id);
            });

        if ($type === 'closed') {
            $query->where('homeworks.submission_date', '<', now()->toDateString());
        } else {
            $query->where('homeworks.submission_date', '>=', now()->toDateString());
        }

        $limit = (int) $request->query('limit', 10);
        $homeworks = $query
            ->latest('homeworks.homework_date')
            ->paginate($limit, [
                'homeworks.id',
                'school_classes.name as class_name',
                'sections.name as section_name',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'homeworks.homework_date',
                'homeworks.submission_date',
                'homeworks.evaluation_date',
                'homeworks.max_marks',
                'homeworks.title',
                'homeworks.description',
                'homeworks.attachment',
                'creator.name as created_by_name',
            ]);

        $items = collect($homeworks->items())->map(fn($h) => [
            'id' => $h->id,
            'class' => $h->class_name,
            'section' => $h->section_name ?? '',
            'subject' => $h->subject_code ? $h->subject_name . ' (' . $h->subject_code . ')' : $h->subject_name,
            'title' => $h->title ?? '',
            'homework_date' => $h->homework_date ? date('Y-m-d', strtotime($h->homework_date)) : '',
            'submission_date' => $h->submission_date ? date('Y-m-d', strtotime($h->submission_date)) : '',
            'evaluation_date' => $h->evaluation_date ? date('Y-m-d', strtotime($h->evaluation_date)) : '',
            'max_marks' => $h->max_marks !== null ? (float) $h->max_marks : null,
            'description' => $h->description ?? '',
            'attachment' => $h->attachment ?? '',
            'created_by' => $h->created_by_name ?? '',
            'status' => $type === 'upcoming' ? 'Pending' : 'Closed',
        ]);

        return $this->success([
            'data' => $items,
            'current_page' => $homeworks->currentPage(),
            'last_page' => $homeworks->lastPage(),
            'total' => $homeworks->total(),
            'from' => $homeworks->firstItem() ?? 0,
            'to' => $homeworks->lastItem() ?? 0,
        ], 'Homework retrieved successfully');
    }

    /**
     * Get the authenticated student's published exam results, grouped per exam,
     * with computed percentage, grade, division and pass/fail.
     */
    public function examResults(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        // Only published results for exams whose results are published.
        $rows = DB::table('exam_results')
            ->join('exams', 'exam_results.exam_id', '=', 'exams.id')
            ->join('exam_groups', 'exams.exam_group_id', '=', 'exam_groups.id')
            ->join('subjects', 'exam_results.subject_id', '=', 'subjects.id')
            ->leftJoin('exam_schedules', function ($join) {
                $join->on('exam_schedules.exam_id', '=', 'exam_results.exam_id')
                     ->on('exam_schedules.subject_id', '=', 'exam_results.subject_id');
            })
            ->where('exam_results.student_id', $user->id)
            ->where('exams.is_result_published', true)
            ->select(
                'exam_results.id',
                'exam_results.exam_id',
                'exam_results.marks',
                'exam_results.is_absent',
                'exam_results.note',
                'exams.name as exam_name',
                'exam_groups.exam_type',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'exam_schedules.max_marks',
                'exam_schedules.min_marks'
            )
            ->orderBy('exams.id')
            ->orderBy('subjects.name')
            ->get();

        $grades = DB::table('marks_grades')->get();
        $divisions = DB::table('marks_divisions')->orderBy('percent_from', 'desc')->get();

        $gradeFor = function (string $examType, float $percent) use ($grades) {
            foreach ($grades as $g) {
                if ($g->exam_type === $examType && $percent >= (float) $g->percent_from && $percent <= (float) $g->percent_upto) {
                    return $g->name;
                }
            }
            return '';
        };

        $divisionFor = function (float $percent) use ($divisions) {
            foreach ($divisions as $d) {
                if ($percent >= (float) $d->percent_from && $percent <= (float) $d->percent_upto) {
                    return $d->name;
                }
            }
            return '';
        };

        $exams = [];
        foreach ($rows as $r) {
            if (!isset($exams[$r->exam_id])) {
                $exams[$r->exam_id] = [
                    'exam_id' => $r->exam_id,
                    'exam_name' => $r->exam_name,
                    'exam_type' => $r->exam_type,
                    'subjects' => [],
                    'grand_total' => 0,
                    'total_obtained' => 0,
                    'has_fail' => false,
                ];
            }

            $maxMarks = (float) ($r->max_marks ?? 100);
            $minMarks = (float) ($r->min_marks ?? 33);
            $obtained = $r->is_absent ? 0 : (float) $r->marks;
            $subjPercent = $maxMarks > 0 ? ($obtained / $maxMarks) * 100 : 0;
            $passed = !$r->is_absent && $obtained >= $minMarks;

            if (!$passed) {
                $exams[$r->exam_id]['has_fail'] = true;
            }

            $exams[$r->exam_id]['subjects'][] = [
                'id' => $r->id,
                'name' => $r->subject_code ? $r->subject_name . ' (' . $r->subject_code . ')' : $r->subject_name,
                'max' => number_format($maxMarks, 2),
                'min' => number_format($minMarks, 2),
                'obtained' => $r->is_absent ? 'Absent' : number_format($obtained, 2),
                'result' => $passed ? 'Pass' : 'Fail',
                'grade' => $gradeFor($r->exam_type, $subjPercent),
                'note' => $r->note ?? '',
            ];

            $exams[$r->exam_id]['grand_total'] += $maxMarks;
            $exams[$r->exam_id]['total_obtained'] += $obtained;
        }

        $result = array_values(array_map(function ($exam) use ($gradeFor, $divisionFor) {
            $grand = $exam['grand_total'];
            $obtained = $exam['total_obtained'];
            $percent = $grand > 0 ? round(($obtained / $grand) * 100, 2) : 0;
            $isGrading = stripos($exam['exam_type'], 'grad') !== false;

            return [
                'exam_id' => $exam['exam_id'],
                'exam_name' => $exam['exam_name'],
                'exam_type' => $exam['exam_type'],
                'is_grading' => $isGrading,
                'subjects' => $exam['subjects'],
                'summary' => [
                    'percentage' => number_format($percent, 2),
                    'result' => $exam['has_fail'] ? 'Fail' : 'Pass',
                    'division' => $exam['has_fail'] ? 'Fail' : $divisionFor($percent),
                    'grade' => $gradeFor($exam['exam_type'], $percent),
                    'grand_total' => number_format($exam['grand_total'], 0),
                    'total_obtained' => number_format($exam['total_obtained'], 0),
                ],
            ];
        }, $exams));

        return $this->success($result, 'Exam results retrieved successfully');
    }

    /**
     * Get teachers list with schedules and existing ratings for the student's class/section.
     */
    public function teachersReviews(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $studentName = trim(($user->name ?? '') . ' ' . ($user->last_name ?? ''));

        // Get class teacher IDs
        $classTeacherIds = DB::table('class_teachers')
            ->where('school_class_id', $user->school_class_id)
            ->where('section_id', $user->section_id)
            ->pluck('staff_id')
            ->toArray();

        // Get timetabled teachers
        $timetable = DB::table('class_timetables')
            ->join('users', 'class_timetables.staff_id', '=', 'users.id')
            ->join('subjects', 'class_timetables.subject_id', '=', 'subjects.id')
            ->where('class_timetables.school_class_id', $user->school_class_id)
            ->where('class_timetables.section_id', $user->section_id)
            ->select(
                'users.id',
                'users.name',
                'users.staff_id as staff_code',
                'users.email',
                'users.phone',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'class_timetables.start_time',
                'class_timetables.end_time',
                'class_timetables.room',
                'class_timetables.day'
            )
            ->orderBy('class_timetables.day')
            ->orderBy('class_timetables.start_time')
            ->get();

        // Get existing ratings by this student
        $existingRatings = DB::table('teacher_ratings')
            ->where('student_name', $studentName)
            ->get()
            ->keyBy('staff_id');

        $teachers = [];
        $seenIds = [];

        foreach ($timetable as $t) {
            $teacherKey = (string) $t->id;

            if (!isset($teachers[$teacherKey])) {
                $seenIds[] = $t->id;
                $rating = $existingRatings->get($teacherKey);
                $teachers[$teacherKey] = [
                    'id' => (int) $t->id,
                    'teacherName' => $t->name . ' (' . ($t->staff_code ?? $t->id) . ')',
                    'isClassTeacher' => in_array($t->id, $classTeacherIds),
                    'email' => $t->email ?? '',
                    'phone' => $t->phone ?? '',
                    'schedule' => [],
                    'rating' => $rating ? (int) $rating->rating : null,
                    'comment' => $rating ? ($rating->comment ?? '') : '',
                    'ratingStatus' => $rating ? $rating->status : null,
                    'ratingId' => $rating ? (int) $rating->id : null,
                ];
            }

            $timeFormatted = '';
            if ($t->start_time) {
                $timeFormatted = date('h:i A', strtotime($t->start_time));
            }
            if ($t->end_time) {
                $timeFormatted .= ' To ' . date('h:i A', strtotime($t->end_time));
            }

            $teachers[$teacherKey]['schedule'][] = [
                'subject' => $t->subject_name . ($t->subject_code ? ' (' . $t->subject_code . ')' : ''),
                'time' => ($t->day ?? '') . ' (' . $timeFormatted . ')',
                'room' => $t->room ?? '',
            ];
        }

        // Add class teachers without timetable entries
        $extraTeachers = DB::table('class_teachers')
            ->join('users', 'class_teachers.staff_id', '=', 'users.id')
            ->where('class_teachers.school_class_id', $user->school_class_id)
            ->where('class_teachers.section_id', $user->section_id)
            ->whereNotIn('users.id', $seenIds)
            ->select('users.id', 'users.name', 'users.staff_id as staff_code', 'users.email', 'users.phone')
            ->get();

        foreach ($extraTeachers as $t) {
            $teacherKey = (string) $t->id;
            $rating = $existingRatings->get($teacherKey);
            $teachers[$teacherKey] = [
                'id' => (int) $t->id,
                'teacherName' => $t->name . ' (' . ($t->staff_code ?? $t->id) . ')',
                'isClassTeacher' => true,
                'email' => $t->email ?? '',
                'phone' => $t->phone ?? '',
                'schedule' => [],
                'rating' => $rating ? (int) $rating->rating : null,
                'comment' => $rating ? ($rating->comment ?? '') : '',
                'ratingStatus' => $rating ? $rating->status : null,
                'ratingId' => $rating ? (int) $rating->id : null,
            ];
        }

        return $this->success(array_values($teachers), 'Teachers reviews retrieved successfully.');
    }

    /**
     * Submit a teacher rating from the student portal.
     */
    public function submitTeacherRating(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'staff_id' => 'required|string',
            'staff_name' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $studentName = trim(($user->name ?? '') . ' ' . ($user->last_name ?? ''));

        // Upsert: update existing rating or create new one
        $existing = DB::table('teacher_ratings')
            ->where('staff_id', $request->staff_id)
            ->where('student_name', $studentName)
            ->first();

        if ($existing) {
            DB::table('teacher_ratings')
                ->where('id', $existing->id)
                ->update([
                    'rating' => (int) $request->rating,
                    'comment' => $request->comment ?? '',
                    'status' => 'Pending',
                    'updated_at' => now(),
                ]);
            $ratingId = $existing->id;
        } else {
            $ratingId = DB::table('teacher_ratings')->insertGetId([
                'staff_id' => $request->staff_id,
                'staff_name' => $request->staff_name,
                'rating' => (int) $request->rating,
                'comment' => $request->comment ?? '',
                'status' => 'Pending',
                'student_name' => $studentName,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $rating = DB::table('teacher_ratings')->find($ratingId);

        return $this->success($rating, 'Teacher rating submitted successfully.', 201);
    }

    /**
     * Get published exams with their schedules for the student portal.
     */
    public function examSchedule(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $exams = DB::table('exams')
            ->where('is_published', true)
            ->get(['id', 'name', 'description']);

        $examIds = $exams->pluck('id');

        $schedules = DB::table('exam_schedules')
            ->join('subjects', 'exam_schedules.subject_id', '=', 'subjects.id')
            ->whereIn('exam_schedules.exam_id', $examIds)
            ->select(
                'exam_schedules.id',
                'exam_schedules.exam_id',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'exam_schedules.date_from',
                'exam_schedules.start_time',
                'exam_schedules.duration',
                'exam_schedules.room_no',
                'exam_schedules.max_marks',
                'exam_schedules.min_marks'
            )
            ->orderBy('exam_schedules.date_from')
            ->orderBy('exam_schedules.start_time')
            ->get()
            ->groupBy('exam_id');

        $result = $exams->map(function ($exam) use ($schedules) {
            $examSchedules = collect($schedules->get($exam->id, []))->map(function ($s) {
                return [
                    'id' => $s->id,
                    'subject' => $s->subject_name,
                    'subject_code' => $s->subject_code ?? '',
                    'date_from' => $s->date_from ? date('m/d/Y', strtotime($s->date_from)) : '',
                    'start_time' => $s->start_time ? date('h:i A', strtotime($s->start_time)) : '',
                    'duration' => (int) $s->duration,
                    'room_no' => $s->room_no ?? '',
                    'max_marks' => (float) $s->max_marks,
                    'min_marks' => (float) $s->min_marks,
                ];
            });

            return [
                'id' => $exam->id,
                'exam' => $exam->name,
                'description' => $exam->description ?? '',
                'schedules' => $examSchedules,
            ];
        });

        return $this->success($result->values(), 'Exam schedule retrieved successfully.');
    }

    /**
     * Get all exam schedules grouped by exam for CBSE user portal (published only).
     */
    public function cbseExamSchedule(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $schedules = DB::table('exam_schedules')
            ->join('exams', 'exam_schedules.exam_id', '=', 'exams.id')
            ->join('subjects', 'exam_schedules.subject_id', '=', 'subjects.id')
            ->where('exams.is_published', true)
            ->select(
                'exam_schedules.id',
                'exams.id as exam_id',
                'exams.name as exam_name',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'exam_schedules.date_from',
                'exam_schedules.start_time',
                'exam_schedules.duration',
                'exam_schedules.room_no'
            )
            ->orderBy('exams.name')
            ->orderBy('exam_schedules.date_from')
            ->orderBy('exam_schedules.start_time')
            ->get()
            ->groupBy('exam_id');

        $result = $schedules->map(function ($items, $examId) {
            $first = $items->first();
            return [
                'id' => (int) $examId,
                'examName' => $first->exam_name ?? '',
                'subjects' => $items->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->subject_name . ($s->subject_code ? ' (' . $s->subject_code . ')' : ''),
                        'date' => $s->date_from ? date('Y-m-d', strtotime($s->date_from)) : '',
                        'startTime' => $s->start_time ? date('h:i A', strtotime($s->start_time)) : '',
                        'duration' => (string) $s->duration,
                        'room' => $s->room_no ?? '',
                    ];
                }),
            ];
        });

        return $this->success($result->values(), 'CBSE exam schedule retrieved successfully.');
    }

    /**
     * Get exam results for the authenticated student (CBSE format).
     */
    public function cbseExamResult(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $studentId = $user->id;

        // Get results for published exams
        $results = DB::table('exam_results')
            ->join('exams', 'exam_results.exam_id', '=', 'exams.id')
            ->join('subjects', 'exam_results.subject_id', '=', 'subjects.id')
            ->leftJoin('exam_schedules', function ($join) {
                $join->on('exam_results.exam_id', '=', 'exam_schedules.exam_id')
                     ->on('exam_results.subject_id', '=', 'exam_schedules.subject_id');
            })
            ->where('exam_results.student_id', $studentId)
            ->where('exams.is_result_published', true)
            ->select(
                'exams.id as exam_id',
                'exams.name as exam_name',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'exam_results.marks',
                'exam_results.theory_marks',
                'exam_results.practical_marks',
                'exam_results.is_absent',
                'exam_results.note',
                'exam_schedules.max_marks',
                'exam_schedules.min_marks'
            )
            ->orderBy('exams.name')
            ->orderBy('subjects.name')
            ->get()
            ->groupBy('exam_id');

        // Compute rank per exam: sum total marks for all students
        $examRanks = [];
        foreach ($results->keys() as $eid) {
            $totals = DB::table('exam_results')
                ->where('exam_id', $eid)
                ->select('student_id',
                    DB::raw('COALESCE(theory_marks, 0) + COALESCE(practical_marks, 0) + COALESCE(marks, 0) as total')
                )
                ->get()
                ->groupBy('student_id')
                ->map(fn($items) => $items->sum('total'))
                ->sortDesc();

            $rank = 1;
            $prevTotal = null;
            $studentRank = null;
            foreach ($totals as $sid => $total) {
                if ($prevTotal !== null && $total < $prevTotal) {
                    $rank++;
                }
                if ((int) $sid === $studentId) {
                    $studentRank = $rank;
                }
                $prevTotal = $total;
            }
            $examRanks[$eid] = $studentRank;
        }

        $data = $results->map(function ($items, $examId) use ($examRanks) {
            $first = $items->first();
            $examName = $first->exam_name ?? '';

            $subjects = collect($items)->map(function ($r) {
                $theoryMax = 100;
                $practicalMax = 75;

                $hasSplit = $r->theory_marks !== null || $r->practical_marks !== null;

                $scores = [];
                $subjectTotal = 0;

                if ($hasSplit) {
                    $t = $r->theory_marks !== null ? (float) $r->theory_marks : 0;
                    $p = $r->practical_marks !== null ? (float) $r->practical_marks : 0;
                    $scores[] = $r->is_absent ? 'AB' : number_format($t, 2);
                    $scores[] = $r->is_absent ? 'AB' : number_format($p, 2);
                    $subjectTotal = $t + $p;
                } else {
                    $m = $r->marks !== null ? (float) $r->marks : 0;
                    $scores[] = $r->is_absent ? 'AB' : number_format($m, 2);
                    $subjectTotal = $m;
                }

                return [
                    'name' => $r->subject_name . ($r->subject_code ? ' (' . $r->subject_code . ')' : ''),
                    'scores' => $scores,
                    'total' => number_format($subjectTotal, 2),
                    'note' => $r->is_absent ? 'Absent' : ($r->note ?? ''),
                ];
            });

            // Determine columns
            $hasSplitAny = collect($items)->contains(fn($r) => $r->theory_marks !== null || $r->practical_marks !== null);
            $columns = $hasSplitAny
                ? [
                    ['name' => 'Theory (TH02)', 'max' => 100],
                    ['name' => 'Practical (PC03)', 'max' => 75],
                ]
                : [
                    ['name' => 'Marks', 'max' => 100],
                ];

            // Summary computation
            $grandTotal = $subjects->sum(fn($s) => (float) $s['total']);
            $grandMax = 0;
            foreach (collect($items) as $r) {
                $hasSplit = $r->theory_marks !== null || $r->practical_marks !== null;
                if ($hasSplit) {
                    $grandMax += 100 + 75;
                } else {
                    $grandMax += (float) ($r->max_marks ?? 100);
                }
            }

            $percentage = $grandMax > 0 ? round(($grandTotal / $grandMax) * 100, 2) : 0;

            // CBSE grade
            $grade = 'F';
            if ($percentage >= 90) $grade = 'A+';
            elseif ($percentage >= 80) $grade = 'A';
            elseif ($percentage >= 70) $grade = 'B+';
            elseif ($percentage >= 60) $grade = 'B';
            elseif ($percentage >= 50) $grade = 'C';
            elseif ($percentage >= 40) $grade = 'D';
            elseif ($percentage >= 33) $grade = 'E';

            return [
                'examName' => $examName,
                'columns' => $columns,
                'subjects' => $subjects,
                'summary' => [
                    'totalMarks' => number_format($grandTotal, 2) . '/' . number_format($grandMax, 2),
                    'percentage' => number_format($percentage, 2),
                    'grade' => $grade,
                    'rank' => (string) ($examRanks[$examId] ?? '-'),
                ],
            ];
        });

        return $this->success($data->values(), 'CBSE exam results retrieved successfully.');
    }

    /**
     * Get student attendance percentage.
     */
    /**
     * Get student's assigned transport route details.
     */
    public function transportRoute(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        // Get the student's assigned route
        $assignment = DB::table('student_transport_assignments')
            ->where('student_id', $user->id)
            ->first();

        if (!$assignment || !$assignment->route_id) {
            return $this->success(null, 'No transport route assigned');
        }

        $route = DB::table('transport_routes')->where('id', $assignment->route_id)->first();
        
        $vehicle = null;
        if ($assignment->vehicle_id) {
            $vehicle = DB::table('transport_vehicles')->where('id', $assignment->vehicle_id)->first();
        }

        $pickupPoints = DB::table('transport_route_pickup_points')
            ->join('transport_pickup_points', 'transport_route_pickup_points.pickup_point_id', '=', 'transport_pickup_points.id')
            ->where('transport_route_pickup_points.route_id', $assignment->route_id)
            ->select(
                'transport_pickup_points.name',
                'transport_route_pickup_points.distance',
                'transport_route_pickup_points.pickup_time',
                'transport_route_pickup_points.id as route_pickup_point_id'
            )
            ->orderBy('transport_route_pickup_points.pickup_time')
            ->get();

        $data = [
            'route' => $route ? ['title' => $route->title] : null,
            'vehicle' => $vehicle ? [
                'vehicle_number' => $vehicle->vehicle_no,
                'vehicle_model' => $vehicle->vehicle_model,
                'made' => $vehicle->year_made, // column is year_made
                'driver_name' => $vehicle->driver_name,
                'driver_licence' => $vehicle->driver_license,
                'driver_contact' => $vehicle->driver_contact,
            ] : null,
            'pickup_points' => $pickupPoints,
            'assigned_pickup_point_id' => $assignment->route_pickup_point_id ?? null,
        ];

        return $this->success($data, 'Transport route retrieved successfully');
    }

    /**
     * Get all hostel rooms for student/parent portal.
     */
    public function hostelRooms(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $assignedRoomId = $user->room_id;

        $rooms = DB::table('rooms')
            ->join('hostels', 'rooms.hostel_id', '=', 'hostels.id')
            ->join('room_types', 'rooms.room_type_id', '=', 'room_types.id')
            ->select(
                'rooms.id',
                'rooms.room_number',
                'rooms.number_of_bed',
                'rooms.cost_per_bed',
                'hostels.name as hostel_name',
                'room_types.name as room_type_name'
            )
            ->get()
            ->map(function ($room) use ($assignedRoomId) {
                return [
                    'id' => $room->id,
                    'hostel' => $room->hostel_name,
                    'room_type' => $room->room_type_name,
                    'room_number' => $room->room_number,
                    'number_of_bed' => $room->number_of_bed,
                    'cost_per_bed' => $room->cost_per_bed,
                    'status' => $room->id === $assignedRoomId ? 'Assigned' : '',
                ];
            });

        return $this->success($rooms, 'Hostel rooms retrieved successfully');
    }

    /**
     * Get the list of books issued to the authenticated user (library card view).
     */
    public function libraryBooksIssued(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent', 'Staff'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = DB::table('book_issues')
            ->join('books', 'book_issues.book_id', '=', 'books.id');

        if ($user->role === 'Staff') {
            $query->where('book_issues.member_id', (string) $user->id)
                  ->where('book_issues.member_type', 'Staff');
        } else {
            if (!$user->admission_no) {
                return $this->success([], 'No books issued');
            }
            $query->where('book_issues.admission_no', $user->admission_no);
        }

        $books = $query
            ->latest('book_issues.issue_date')
            ->get([
                'book_issues.id',
                'books.book_number',
                'books.title',
                'books.author',
                'book_issues.issue_date',
                'book_issues.due_date',
                'book_issues.return_date',
            ])
            ->map(fn($b) => [
                'id' => $b->id,
                'title' => $b->title ?? '',
                'bookNumber' => $b->book_number ?? '',
                'author' => $b->author ?? '',
                'issueDate' => $b->issue_date ? date('Y-m-d', strtotime($b->issue_date)) : '',
                'dueReturnDate' => $b->due_date ? date('Y-m-d', strtotime($b->due_date)) : '',
                'returnDate' => $b->return_date ? date('Y-m-d', strtotime($b->return_date)) : '',
            ]);

        return $this->success($books, 'Books issued retrieved successfully');
    }

    /**
     * Get visitors list for the user portal.
     */
    public function userVisitors(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = DB::table('visitors');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page', 50));
        $paginated = $query->orderByDesc('date')->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($v) {
            return [
                'id' => $v->id,
                'purpose' => $v->purpose ?? '',
                'visitorName' => $v->visitor_name ?? '',
                'phone' => $v->phone ?? '',
                'idCard' => $v->id_card ?? '',
                'numberOfPerson' => (int) ($v->number_of_person ?? 0),
                'note' => $v->note ?? '',
                'meetingWith' => $v->meeting_with ?? '',
                'date' => $v->date ? date('m/d/Y', strtotime($v->date)) : '',
                'inTime' => $v->in_time ? date('h:i A', strtotime($v->in_time)) : '',
                'outTime' => $v->out_time ? date('h:i A', strtotime($v->out_time)) : '',
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'Visitors retrieved successfully.');
    }

    /**
     * Get video tutorials for the user portal (filtered by student's class/section).
     */
    public function userVideoTutorials(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = DB::table('video_tutorials');

        // Filter by student's class and section
        $query->where(function ($q) use ($user) {
            $q->whereNull('class_id')
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('class_id', $user->school_class_id);
                  if ($user->section_id) {
                      $q2->where(function ($q3) use ($user) {
                          $q3->whereNull('section_id')
                             ->orWhere('section_id', $user->section_id);
                      });
                  }
              });
        });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%");
        }

        $perPage = (int) ($request->input('per_page', 12));
        $paginated = $query->orderByDesc('created_at')->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($v) {
            return [
                'id' => $v->id,
                'title' => $v->title,
                'videoUrl' => $v->video_url ?? '',
                'thumbnail' => $v->thumbnail ?? '',
                'description' => $v->description ?? '',
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'Video tutorials retrieved successfully.');
    }

    /**
     * Get recent visitors.
     */
    private function getVisitors(): array
    {
        return DB::table('visitors')
            ->latest('date')->limit(5)
            ->get(['id', 'visitor_name as name', 'purpose', 'date'])
            ->map(fn($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'purpose' => $v->purpose,
                'date' => $v->date ? date('m/d/Y', strtotime($v->date)) : '',
            ])
            ->toArray();
    }

    /**
     * Get library books issued to this user.
     */
    private function getLibraryBooks(User $user): array
    {
        if (!$user->admission_no) {
            return [];
        }

        return DB::table('book_issues')
            ->join('books', 'book_issues.book_id', '=', 'books.id')
            ->where('book_issues.admission_no', $user->admission_no)
            ->latest('book_issues.issue_date')->limit(10)
            ->get(['book_issues.id', 'books.book_number as book_no', 'books.title as book_title', 'books.author', 'book_issues.issue_date', 'book_issues.due_date', 'book_issues.return_date'])
            ->map(fn($b) => [
                'id' => $b->id,
                'no' => $b->book_no ?? '',
                'title' => $b->book_title ?? '',
                'author' => $b->author ?? '',
                'issueDate' => $b->issue_date ? date('m/d/Y', strtotime($b->issue_date)) : '',
                'returnDate' => $b->return_date ? date('m/d/Y', strtotime($b->return_date)) : ($b->due_date ? date('m/d/Y', strtotime($b->due_date)) : ''),
            ])
            ->toArray();
    }

    /**
     * Get attendance records for the authenticated student, filtered by month/year.
     */
    public function userAttendance(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $month = (int) ($request->input('month', date('m')));
        $year = (int) ($request->input('year', date('Y')));

        $records = DB::table('student_attendances')
            ->where('student_id', $user->id)
            ->whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->get(['attendance_date', 'attendance']);

        $attendanceMap = [];
        foreach ($records as $r) {
            $day = (int) date('j', strtotime($r->attendance_date));
            $label = match ($r->attendance) {
                'present' => 'Present',
                'late' => 'Late',
                'absent' => 'Absent',
                'half_day' => 'Half Day',
                'holiday' => 'Holiday',
                'on_leave' => 'On Leave',
                default => ucfirst($r->attendance),
            };
            $attendanceMap[$day] = $label;
        }

        $percentage = $this->getStudentAttendancePercentage($user);

        return $this->success([
            'month' => $month,
            'year' => $year,
            'daysInMonth' => (int) date('t', strtotime("{$year}-{$month}-01")),
            'startDayOfWeek' => (int) date('N', strtotime("{$year}-{$month}-01")),
            'attendance' => $attendanceMap,
            'percentage' => $percentage,
        ], 'Attendance records retrieved successfully.');
    }

    /**
     * Get student attendance percentage.
     */
    private function getStudentAttendancePercentage(User $user): float
    {
        // Mirror AttendanceReportController: holidays/leave are not working days.
        $counts = DB::table('student_attendances')
            ->where('student_id', $user->id)
            ->whereNotIn('attendance', ['holiday', 'on_leave'])
            ->selectRaw("
                COUNT(*) as working_days,
                SUM(attendance = 'present') as present,
                SUM(attendance = 'late') as late,
                SUM(attendance = 'half_day') as half_day
            ")
            ->first();

        $workingDays = (int) ($counts->working_days ?? 0);
        if ($workingDays === 0) {
            return 0;
        }

        $presentDays = (int) $counts->present + (int) $counts->late + ((int) $counts->half_day * 0.5);

        return round(($presentDays / $workingDays) * 100, 2);
    }

    /**
     * Get behaviour records for the authenticated student/parent.
     */
    public function userBehaviour(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        // If Parent, resolve the linked student
        $studentId = $user->role === 'Parent'
            ? $user->student_id ?? $user->id
            : $user->id;

        $incidents = \App\Models\AssignedIncident::with(['incident', 'assignedBy:id,name'])
            ->where('student_id', $studentId)
            ->orderBy('incident_date', 'desc')
            ->get();

        $totalPoints = $incidents->sum('point');
        $totalIncidents = $incidents->count();

        $data = [
            'total_points' => (int) $totalPoints,
            'total_incidents' => (int) $totalIncidents,
            'incidents' => $incidents->map(fn($ai) => [
                'id' => $ai->id,
                'incident_date' => $ai->incident_date,
                'title' => $ai->incident?->title,
                'point' => (int) $ai->point,
                'description' => $ai->description,
                'assigned_by' => $ai->assignedBy?->name,
            ]),
        ];

        return $this->success($data, 'Behaviour records retrieved successfully.');
    }

    /**
     * Get leave types for the user portal.
     */
    public function userLeaveTypes(Request $request): JsonResponse
    {
        $types = DB::table('leave_types')->get(['id', 'name']);
        return $this->success($types, 'Leave types retrieved successfully.');
    }

    /**
     * Get leave requests for the authenticated student, or create a new one.
     */
    public function userApplyLeave(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        if ($request->isMethod('post')) {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'leave_type_id' => 'required|exists:leave_types,id',
                'leave_from' => 'required|date',
                'leave_to' => 'required|date|after_or_equal:leave_from',
                'reason' => 'nullable|string|max:1000',
                'half_day' => 'nullable|in:First Half,Second Half',
            ]);

            if ($validator->fails()) {
                return $this->error($validator->errors()->first(), 422);
            }

            $from = \Carbon\Carbon::parse($request->leave_from);
            $to = \Carbon\Carbon::parse($request->leave_to);
            $days = $from->diffInDays($to) + 1;

            $id = DB::table('leave_requests')->insertGetId([
                'user_id' => $user->id,
                'leave_type_id' => $request->leave_type_id,
                'leave_from' => $request->leave_from,
                'leave_to' => $request->leave_to,
                'days' => $days,
                'apply_date' => now()->format('Y-m-d'),
                'half_day' => $request->half_day,
                'status' => 'Pending',
                'reason' => $request->reason ?? '',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $leave = DB::table('leave_requests')->where('id', $id)->first();

            return $this->success($leave, 'Leave request submitted successfully.', 201);
        }

        // GET: list leave requests
        $query = DB::table('leave_requests')
            ->leftJoin('leave_types', 'leave_requests.leave_type_id', '=', 'leave_types.id')
            ->where('leave_requests.user_id', $user->id);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('leave_types.name', 'like', "%{$search}%")
                  ->orWhere('leave_requests.reason', 'like', "%{$search}%")
                  ->orWhere('leave_requests.apply_date', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page', 50));
        $paginated = $query->orderByDesc('leave_requests.created_at')
            ->select(
                'leave_requests.id',
                'leave_requests.leave_from',
                'leave_requests.leave_to',
                'leave_requests.days',
                'leave_requests.apply_date',
                'leave_requests.half_day',
                'leave_requests.status',
                'leave_requests.reason',
                'leave_requests.admin_remark',
                'leave_types.name as leave_type_name'
            )
            ->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($r) {
            return [
                'id' => $r->id,
                'leaveType' => $r->leave_type_name ?? '',
                'applyDate' => $r->apply_date ? date('Y-m-d', strtotime($r->apply_date)) : '',
                'fromDate' => $r->leave_from ? date('Y-m-d', strtotime($r->leave_from)) : '',
                'toDate' => $r->leave_to ? date('Y-m-d', strtotime($r->leave_to)) : '',
                'days' => (float) $r->days,
                'halfDay' => $r->half_day ?? '',
                'reason' => $r->reason ?? '',
                'status' => $r->status ?? 'Pending',
                'adminRemark' => $r->admin_remark ?? '',
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'Leave requests retrieved successfully.');
    }

    /**
     * Get online exams for the student portal (published only).
     */
    public function userOnlineExams(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = DB::table('online_exams')
            ->where('is_published', true);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%");
        }

        $now = now();
        if ($request->input('status') === 'upcoming') {
            $query->where('exam_to', '>=', $now);
        } elseif ($request->input('status') === 'closed') {
            $query->where('exam_to', '<', $now);
        }

        $perPage = (int) ($request->input('per_page', 50));
        $paginated = $query->orderByDesc('created_at')
            ->select([
                'id', 'title', 'is_quiz', 'exam_from', 'exam_to',
                'duration', 'attempt', 'passing_percentage',
                'is_result_published', 'description',
            ])
            ->paginate($perPage);

        $studentId = $user->id;

        $rows = collect($paginated->items())->map(function ($exam) use ($studentId, $now) {
            $attemptedCount = DB::table('online_exam_attempts')
                ->where('online_exam_id', $exam->id)
                ->where('student_id', $studentId)
                ->count();

            $status = 'Available';
            if ($attemptedCount > 0) {
                if ($exam->is_result_published) {
                    $latestAttempt = DB::table('online_exam_attempts')
                        ->where('online_exam_id', $exam->id)
                        ->where('student_id', $studentId)
                        ->orderByDesc('created_at')
                        ->first();
                    
                    if ($latestAttempt) {
                        $pct = $latestAttempt->total_marks > 0 
                            ? ($latestAttempt->earned_marks / $latestAttempt->total_marks) * 100 
                            : 0;
                        if ($pct >= ($exam->passing_percentage ?? 33)) {
                            $status = 'Passed';
                        } else {
                            $status = 'Failed';
                        }
                    } else {
                        $status = 'Submitted';
                    }
                } else {
                    $status = 'Submitted';
                }
            } elseif ($exam->exam_to && $exam->exam_to < $now) {
                $status = 'Closed';
            }

            return [
                'id' => $exam->id,
                'exam' => $exam->title,
                'isQuiz' => (bool) $exam->is_quiz,
                'dateFrom' => $exam->exam_from ? date('d/m/Y h:i a', strtotime($exam->exam_from)) : '',
                'dateTo' => $exam->exam_to ? date('d/m/Y h:i a', strtotime($exam->exam_to)) : '',
                'duration' => $exam->duration ?? '',
                'totalAttempt' => (int) ($exam->attempt ?? 0),
                'attempted' => $attemptedCount,
                'status' => $status,
                'description' => $exam->description ?? '',
                'passingPercentage' => (int) ($exam->passing_percentage ?? 0),
                'isResultPublished' => (bool) $exam->is_result_published,
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'Online exams retrieved successfully.');
    }

    /**
     * Get details and questions of a specific online exam for a student.
     */
    public function userOnlineExamDetails(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $exam = \App\Models\OnlineExam::with(['questions'])->where('is_published', true)->find($id);

        if (!$exam) {
            return $this->error('Online exam not found or not published', 404);
        }

        $attemptedCount = DB::table('online_exam_attempts')
            ->where('online_exam_id', $exam->id)
            ->where('student_id', $user->id)
            ->count();

        $attempts = DB::table('online_exam_attempts')
            ->where('online_exam_id', $exam->id)
            ->where('student_id', $user->id)
            ->orderBy('created_at')
            ->get();

        $now = now();
        $isClosed = $exam->exam_to && $exam->exam_to < $now;
        $isExhausted = $exam->attempt > 0 && $attemptedCount >= $exam->attempt;

        // Strip correct answer if result is not published yet or exam is not closed
        $questions = $exam->questions->map(function ($q) use ($exam, $isClosed) {
            $showAnswers = $exam->is_result_published || $isClosed;
            return [
                'id' => $q->id,
                'question_type' => $q->question_type,
                'question' => $q->question,
                'options' => $q->options,
                'level' => $q->level,
                'subject' => $q->subject,
                'marks' => $q->pivot->marks ?? 1,
                'correct_answer' => $showAnswers ? $q->correct_answer : null,
            ];
        });

        return $this->success([
            'id' => $exam->id,
            'title' => $exam->title,
            'is_quiz' => (bool) $exam->is_quiz,
            'exam_from' => $exam->exam_from,
            'exam_to' => $exam->exam_to,
            'duration' => $exam->duration,
            'attempt' => $exam->attempt,
            'attempted' => $attemptedCount,
            'passing_percentage' => $exam->passing_percentage,
            'is_result_published' => $exam->is_result_published,
            'description' => $exam->description,
            'is_closed' => $isClosed,
            'is_exhausted' => $isExhausted,
            'questions' => $questions,
            'attempts' => $attempts,
        ], 'Online exam details retrieved successfully.');
    }

    /**
     * Submit attempts for a student taking an online exam.
     */
    public function submitUserOnlineExam(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $exam = \App\Models\OnlineExam::with(['questions'])->where('is_published', true)->find($id);

        if (!$exam) {
            return $this->error('Online exam not found or not published', 404);
        }

        $attemptedCount = DB::table('online_exam_attempts')
            ->where('online_exam_id', $exam->id)
            ->where('student_id', $user->id)
            ->count();

        $now = now();
        if ($exam->exam_to && $exam->exam_to < $now) {
            return $this->error('This exam has already closed.', 400);
        }

        if ($exam->attempt > 0 && $attemptedCount >= $exam->attempt) {
            return $this->error('You have already exhausted all attempts for this exam.', 400);
        }

        $answers = $request->input('answers', []); // structure: [ { question_id, answer } ]
        
        $totalQuestions = $exam->questions->count();
        $totalMarks = 0;
        $earnedMarks = 0;

        foreach ($exam->questions as $q) {
            $marks = $q->pivot->marks ?? 1;
            $totalMarks += $marks;

            // Find submitted answer
            $submitted = collect($answers)->firstWhere('question_id', $q->id);
            $submittedAnswer = $submitted ? $submitted['answer'] : null;

            if ($submittedAnswer !== null) {
                // simple grading for Single Choice / True/False / quiz mode
                $correct = strtolower(trim($q->correct_answer ?? ''));
                $given = strtolower(trim(is_array($submittedAnswer) ? implode(',', $submittedAnswer) : strval($submittedAnswer)));

                if ($correct !== '' && $correct === $given) {
                    $earnedMarks += $marks;
                }
            }
        }

        // Create attempt
        $attempt = \App\Models\OnlineExamAttempt::create([
            'online_exam_id' => $exam->id,
            'student_id' => $user->id,
            'started_at' => $request->input('started_at', $now),
            'completed_at' => $now,
            'total_questions' => $totalQuestions,
            'total_marks' => $totalMarks,
            'earned_marks' => $earnedMarks,
            'status' => 'submitted',
            'is_submitted' => true,
        ]);

        return $this->success($attempt, 'Exam attempt submitted successfully.');
    }

    /**
     * Get lesson plan for the student's class/section grouped by week.
     */
    public function userLessonPlan(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return $this->error('Unauthorized', 401);
        }

        // Allow optional query params to override auto-detection (admin preview, etc.)
        $classId = $request->input('school_class_id', $user->school_class_id);
        $sectionId = $request->input('section_id', $user->section_id);

        $className = $classId
            ? DB::table('school_classes')->where('id', $classId)->value('name')
            : null;
        $sectionName = $sectionId
            ? DB::table('sections')->where('id', $sectionId)->value('name')
            : null;

        // Resolve to the active academic session
        $activeSessionId = \App\Models\AcademicSession::where('is_active', true)->value('id');

        if ($activeSessionId && $className) {
            $resolvedClassId = DB::table('school_classes')
                ->where('name', $className)
                ->where('academic_session_id', $activeSessionId)
                ->value('id');
            if ($resolvedClassId) {
                $classId = $resolvedClassId;
            }
        }

        if ($activeSessionId && $sectionName && $classId) {
            $resolvedSectionId = DB::table('sections')
                ->where('name', $sectionName)
                ->where('school_class_id', $classId)
                ->where('academic_session_id', $activeSessionId)
                ->value('id');
            if ($resolvedSectionId) {
                $sectionId = $resolvedSectionId;
            }
        }

        if (!$classId || !$sectionId) {
            $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            $weekOffset = (int) $request->input('week', 0);
            $now = now()->startOfWeek()->addWeeks($weekOffset);
            $startDate = $now->copy();
            $endDate = $now->copy()->endOfWeek();
            $schedule = [];
            $currentDate = $startDate->copy();
            foreach ($days as $day) {
                $schedule[] = ['day' => $day, 'date' => $currentDate->format('m/d/Y'), 'plans' => []];
                $currentDate->addDay();
            }
            return $this->success([
                'weekStart' => $startDate->format('m/d/Y'),
                'weekEnd' => $endDate->format('m/d/Y'),
                'schedule' => $schedule,
            ], 'No class/section assigned.');
        }

        $weekOffset = (int) $request->input('week', 0);
        $now = now()->startOfWeek()->addWeeks($weekOffset);
        $startDate = $now->copy();
        $endDate = $now->copy()->endOfWeek();

        $timetables = DB::table('class_timetables')
            ->join('subjects', 'class_timetables.subject_id', '=', 'subjects.id')
            ->where('class_timetables.school_class_id', $classId)
            ->where('class_timetables.section_id', $sectionId)
            ->select(
                'class_timetables.id',
                'class_timetables.day',
                'class_timetables.start_time',
                'class_timetables.end_time',
                'class_timetables.room',
                'subjects.name as subject_name',
                'subjects.code as subject_code'
            )
            ->get()
            ->groupBy('day');

        $lessonPlans = DB::table('lesson_plans')
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->groupBy(function ($plan) {
                return $plan->date . '|' . $plan->class_timetable_id;
            });

        $weeklyPlan = [];
        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $day = $currentDate->format('l');
            $dateStr = $currentDate->format('Y-m-d');
            $dayTts = $timetables->get($day, collect());

            $plans = $dayTts->map(function ($tt) use ($dateStr, $lessonPlans) {
                $lp = $lessonPlans->get($dateStr . '|' . $tt->id)?->first();
                return [
                    'subject' => $tt->subject_name . ($tt->subject_code ? ' (' . $tt->subject_code . ')' : ''),
                    'time' => ($tt->start_time ?? '') . ' - ' . ($tt->end_time ?? ''),
                    'room' => $tt->room ?? '',
                    'lesson' => $lp->lesson ?? '',
                    'topic' => $lp->topic ?? '',
                    'subTopic' => $lp->sub_topic ?? '',
                ];
            });

            $weeklyPlan[] = [
                'day' => $day,
                'date' => $currentDate->format('m/d/Y'),
                'plans' => array_values($plans->toArray()),
            ];

            $currentDate->addDay();
        }

        return $this->success([
            'weekStart' => $startDate->format('m/d/Y'),
            'weekEnd' => $endDate->format('m/d/Y'),
            'schedule' => $weeklyPlan,
        ], 'Lesson plan retrieved successfully.');
    }

    /**
     * Get GMeet live classes for the student's class/section.
     */
    public function userGmeetLiveClasses(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = DB::table('gmeet_classes')
            ->leftJoin('users', 'gmeet_classes.staff_id', '=', 'users.id')
            ->leftJoin('school_classes', 'gmeet_classes.class_id', '=', 'school_classes.id')
            ->leftJoin('sections', 'gmeet_classes.section_id', '=', 'sections.id')
            ->where('gmeet_classes.class_id', $user->school_class_id);

        if ($user->section_id) {
            $query->where('gmeet_classes.section_id', $user->section_id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('gmeet_classes.title', 'like', "%{$search}%")
                  ->orWhere('gmeet_classes.description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page', 50));
        $paginated = $query->orderByDesc('gmeet_classes.date_time')
            ->select(
                'gmeet_classes.id',
                'gmeet_classes.title',
                'gmeet_classes.description',
                'gmeet_classes.date_time',
                'gmeet_classes.duration',
                'gmeet_classes.status',
                'gmeet_classes.meeting_url',
                'users.name as host_name',
                'users.last_name as host_last_name',
                'users.role as host_role',
                'users.staff_id as host_code',
                'school_classes.name as class_name',
                'sections.name as section_name'
            )
            ->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($c) {
            $host = trim(($c->host_name ?? '') . ' ' . ($c->host_last_name ?? ''));
            $role = $c->host_role ? ucfirst(strtolower($c->host_role)) : 'Teacher';
            if ($c->host_code) {
                $host .= " ({$role} : {$c->host_code})";
            }
            $classLabel = $c->class_name ?? '';
            if ($c->section_name) {
                $classLabel .= " ({$c->section_name})";
            }

            return [
                'id' => $c->id,
                'title' => $c->title,
                'description' => $c->description ?? '',
                'dateTime' => $c->date_time ? date('m/d/Y H:i:s', strtotime($c->date_time)) : '',
                'duration' => (int) $c->duration,
                'className' => $classLabel,
                'host' => $host,
                'status' => ucfirst(strtolower($c->status ?? '')),
                'url' => $c->meeting_url ?? '',
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'GMeet live classes retrieved successfully.');
    }

    public function userOnlineCourses(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $query = \App\Models\OnlineCourse::query();

        $query->where(function ($q) use ($user) {
            $q->whereNull('class_id')
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('class_id', $user->school_class_id)
                     ->where(function ($q3) use ($user) {
                         $q3->whereNull('section_id')
                            ->orWhere('section_id', $user->section_id);
                     });
              });
        });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('instructor_name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page') ?: 12);
        $paginated = $query->orderByDesc('created_at')->paginate($perPage);

        $rows = collect($paginated->items())->map(function ($course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'subtitle' => $course->subtitle ?? '',
                'description' => $course->description ?? '',
                'category' => $course->category ?? '',
                'instructor_name' => $course->instructor_name ?? ($course->instructor?->name ?? ''),
                'image' => $course->image ?? '',
                'price' => (float) $course->price,
                'original_price' => (float) ($course->original_price ?? 0),
                'class_name' => $course->class_name ?? '',
                'total_lessons' => (int) ($course->total_lessons ?? 0),
                'total_hours' => $course->total_hours ?? '',
                'total_exams' => (int) ($course->total_exams ?? 0),
                'total_assignments' => (int) ($course->total_assignments ?? 0),
                'total_quizzes' => (int) ($course->total_quizzes ?? 0),
                'outline' => $course->outline ? (is_string($course->outline) ? json_decode($course->outline) : $course->outline) : [],
                'live_classes' => $course->live_classes ? (is_string($course->live_classes) ? json_decode($course->live_classes) : $course->live_classes) : [],
                'quizzes' => $course->quizzes ? (is_string($course->quizzes) ? json_decode($course->quizzes) : $course->quizzes) : [],
            ];
        });

        return $this->success([
            'data' => $rows,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
        ], 'Online courses retrieved successfully.');
    }

    /**
     * Build the placeholder/field values for the authenticated student,
     * used to render certificates and ID cards in the student portal.
     */
    /**
     * Return the logged-in student's QR code value (and NFC UID) so they can
     * display/print it from the portal for tap-based attendance.
     */
    public function userMyQrCode(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        return $this->success([
            'name'         => trim($user->name . ($user->last_name ? ' ' . $user->last_name : '')),
            'admission_no' => $user->admission_no ?? '',
            'role'         => $user->role,
            'avatar'       => $user->avatar ? url('storage/' . $user->avatar) : null,
            'qr_code'      => $user->qr_code,
            'nfc_uid'      => $user->nfc_uid,
            'has_qr'       => !is_null($user->qr_code),
            'has_nfc'      => !is_null($user->nfc_uid),
        ], 'QR code data fetched successfully.');
    }

    /**
     * Active branches in the institution (read-only) for the student/parent portal.
     */
    public function userBranches(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $branches = \App\Models\Branch::query()
            ->orderBy('branch_name')
            ->get(['id', 'branch_name', 'branch_url']);

        return $this->success(['branches' => $branches], 'Branches retrieved successfully.');
    }

    private function studentCardFields($user): array
    {
        $user->loadMissing(['schoolClass', 'section', 'studentCategory']);

        return [
            'name' => trim($user->name . ($user->last_name ? ' ' . $user->last_name : '')),
            'admission_no' => $user->admission_no ?? '',
            'roll_no' => $user->roll_no ?? '',
            'class' => $user->schoolClass->name ?? '',
            'section' => $user->section->name ?? '',
            'gender' => $user->gender ?? '',
            'dob' => $user->dob ? date('m/d/Y', strtotime($user->dob)) : '',
            'category' => $user->studentCategory->name ?? $user->category ?? '',
            'father_name' => $user->father_name ?? '',
            'mother_name' => $user->mother_name ?? '',
            'guardian' => $user->guardian_name ?? '',
            'religion' => $user->religion ?? '',
            'caste' => $user->caste ?? '',
            'email' => $user->email ?? '',
            'phone' => $user->phone ?? '',
            'blood_group' => $user->blood_group ?? '',
            'house' => $user->house ?? '',
            'present_address' => $user->current_address ?? '',
            'permanent_address' => $user->permanent_address ?? '',
            'admission_date' => $user->admission_date ? date('m/d/Y', strtotime($user->admission_date)) : '',
            'image' => $user->avatar ? url('storage/' . $user->avatar) : null,
        ];
    }

    /**
     * Active student certificate templates + the student's field values.
     */
    public function userCertificates(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $certificates = \App\Models\StudentCertificate::where('is_active', true)
            ->orderByDesc('id')
            ->get();

        return $this->success([
            'certificates' => $certificates,
            'student' => $this->studentCardFields($user),
        ], 'Certificates retrieved successfully.');
    }

    /**
     * Active student ID card templates + the student's field values.
     */
    public function userIdCard(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['Student', 'Parent'])) {
            return $this->error('Unauthorized access', 403);
        }

        $cards = \App\Models\StudentIdCard::where('is_active', true)
            ->orderByDesc('id')
            ->get();

        return $this->success([
            'cards' => $cards,
            'student' => $this->studentCardFields($user),
        ], 'ID cards retrieved successfully.');
    }

    /**
     * Get active payment gateways for the portal.
     */
    public function activePaymentGateways(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthorized access', 403);
        }

        // Return gateways that are active
        $gateways = DB::table('payment_gateway_settings')
            ->where('status', 1)
            ->where('provider', '!=', 'active_gateway')
            ->get(['provider', 'config'])
            ->map(function ($g) {
                // Decode config, but we might just need the provider name
                // for offline it has name and description
                $config = json_decode($g->config, true) ?: [];
                return [
                    'provider' => $g->provider,
                    'name' => $config['name'] ?? ucfirst($g->provider),
                    'description' => $config['description'] ?? '',
                    'instructions' => $config['instructions'] ?? '',
                ];
            });

        return $this->success($gateways, 'Active payment gateways retrieved.');
    }

    /**
     * Submit an offline fee payment (pending admin approval).
     */
    public function submitOfflineFeePayment(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthorized access', 403);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'student_fee_master_id' => 'required|integer',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'reference_no' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_no' => 'nullable|string|max:255',
            'screenshot' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $sfm = \App\Models\StudentFeeMaster::find($request->student_fee_master_id);
        if (!$sfm || $sfm->student_id != $user->id) {
            return $this->error('Invalid fee record or unauthorized.', 404);
        }

        // Check if there's already a pending offline payment for this fee
        $exists = DB::table('offline_bank_payments')
            ->where('student_fee_master_id', $sfm->id)
            ->where('status', 'pending')
            ->exists();
        
        if ($exists) {
            return $this->error('A pending payment already exists for this fee.', 422);
        }

        $screenshotPath = null;
        if ($request->hasFile('screenshot')) {
            $screenshotPath = $request->file('screenshot')->store('offline_payments', 'public');
        }

        DB::table('offline_bank_payments')->insert([
            'student_id' => $user->id,
            'student_fee_master_id' => $sfm->id,
            'amount' => $request->amount,
            'payment_date' => $request->payment_date,
            'reference_no' => $request->reference_no,
            'bank_name' => $request->bank_name,
            'bank_account_no' => $request->bank_account_no,
            'screenshot' => $screenshotPath,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->success(null, 'Payment submitted successfully. Pending admin approval.');
    }
}
