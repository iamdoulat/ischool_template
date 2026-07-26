<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\OnlineAdmission;
use App\Models\User;
use App\Models\AcademicSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Services\OnlineAdmissionNotification;
use App\Models\GeneralSetting;

class OnlineAdmissionController extends BaseController
{
    protected $notificationService;

    public function __construct(OnlineAdmissionNotification $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    /**
     * List online admissions with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OnlineAdmission::with(['schoolClass', 'section', 'academicSession', 'studentCategory']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('father_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        $admissions = $query->latest()->paginate($request->get('limit', 50));

        return $this->success($admissions, 'Online admissions retrieved successfully');
    }

    /**
     * Show a single admission record.
     */
    public function show($id): JsonResponse
    {
        $admission = OnlineAdmission::with(['schoolClass', 'section', 'academicSession', 'studentCategory'])->findOrFail($id);
        return $this->success($admission, 'Admission record retrieved successfully');
    }

    /**
     * Update an admission record.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $admission = OnlineAdmission::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'dob' => 'required|date',
            'gender' => 'required|string',
            'father_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'category' => 'nullable|string',
            'religion' => 'nullable|string',
            'caste' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'house' => 'nullable|string',
            'height' => 'nullable|string',
            'weight' => 'nullable|string',
            'measurement_date' => 'nullable|date',
            'father_phone' => 'nullable|string',
            'father_occupation' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'mother_phone' => 'nullable|string',
            'mother_occupation' => 'nullable|string',
            'guardian_type' => 'nullable|string',
            'guardian_name' => 'nullable|string',
            'guardian_relation' => 'nullable|string',
            'guardian_phone' => 'nullable|string',
            'guardian_email' => 'nullable|email',
            'guardian_occupation' => 'nullable|string',
            'guardian_address' => 'nullable|string',
            'current_address' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'student_photo' => 'nullable|image|max:2048',
            'form_status' => 'nullable|string',
            'payment_status' => 'nullable|string',
        ]);

        if ($request->hasFile('student_photo')) {
            $path = $request->file('student_photo')->store('online-admissions', 'public');
            $validated['student_photo'] = $path;
        }

        $admission->update($validated);

        return $this->success($admission, 'Admission record updated successfully');
    }

    /**
     * Update admission status (form or payment).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $admission = OnlineAdmission::findOrFail($id);

        $validated = $request->validate([
            'form_status' => 'nullable|string',
            'payment_status' => 'nullable|string',
        ]);

        $admission->update($validated);

        return $this->success($admission, 'Admission status updated successfully');
    }

    /**
     * Enroll an applicant as a student.
     */
    public function enroll(Request $request, $id): JsonResponse
    {
        $admission = OnlineAdmission::findOrFail($id);

        if ($admission->is_enrolled) {
            return $this->error('Student is already enrolled', 400);
        }

        DB::beginTransaction();
        try {
            $settings = GeneralSetting::first();
            
            // 1. Generate Admission No
            $admissionNo = $this->generateAdmissionNo($settings);

            // 2. Generate Roll No (Class & Section wise)
            $rollNo = null;
            if ($settings && $settings->auto_roll_no) {
                $rollNo = $this->generateRollNo($settings, $admission->school_class_id, $admission->section_id);
            }

            // 3. Handle email uniqueness - if email already exists, set to null
            $email = $admission->email;
            if ($email && User::where('email', $email)->exists()) {
                $email = null;
            }

            // 4. Generate student username if auto enabled
            $studentUsername = null;
            if ($settings && $settings->auto_username) {
                $studentUsername = $this->generateUsername($settings, 'student');
            }

            // 5. Generate parent username if auto enabled
            $parentUsername = null;
            if ($settings && $settings->auto_parent_username) {
                $parentUsername = $this->generateUsername($settings, 'parent');
            }

            $studentData = [
                'name' => $admission->first_name,
                'middle_name' => $admission->middle_name,
                'last_name' => $admission->last_name,
                'email' => $email,
                'phone' => $admission->phone,
                'username' => $studentUsername,
                'password' => Hash::make($admissionNo),
                'role' => 'Student',
                'admission_no' => $admissionNo,
                'roll_no' => $rollNo,
                'school_class_id' => $admission->school_class_id,
                'section_id' => $admission->section_id,
                'dob' => $admission->dob,
                'gender' => $admission->gender,
                'category' => $admission->category,
                'religion' => $admission->religion,
                'caste' => $admission->caste,
                'father_name' => $admission->father_name,
                'father_phone' => $admission->father_phone,
                'father_occupation' => $admission->father_occupation,
                'mother_name' => $admission->mother_name,
                'mother_phone' => $admission->mother_phone,
                'mother_occupation' => $admission->mother_occupation,
                'guardian_type' => $admission->guardian_type,
                'guardian_name' => $admission->guardian_name ?? $admission->father_name,
                'guardian_phone' => $admission->guardian_phone ?? $admission->father_phone,
                'guardian_relation' => $admission->guardian_relation ?? 'Father',
                'guardian_email' => $admission->guardian_email,
                'guardian_occupation' => $admission->guardian_occupation,
                'guardian_address' => $admission->guardian_address,
                'current_address' => $admission->current_address,
                'permanent_address' => $admission->permanent_address,
                'blood_group' => $admission->blood_group,
                'house' => $admission->house,
                'height' => $admission->height,
                'weight' => $admission->weight,
                'measurement_date' => $admission->measurement_date,
                'active' => true,
                'academic_session_id' => $admission->academic_session_id,
                'avatar' => $admission->student_photo,
                'admission_date' => now()->toDateString(),
            ];

            $user = User::create($studentData);

            // Create Parent User Account
            $parentPassword = $parentUsername ?: $admissionNo;
            $parentData = [
                'name' => $admission->guardian_name ?? $admission->father_name,
                'email' => $admission->guardian_email,
                'phone' => $admission->guardian_phone ?? $admission->father_phone,
                'username' => $parentUsername,
                'password' => Hash::make($parentPassword),
                'role' => 'Parent',
                'guardian_name' => $admission->guardian_name ?? $admission->father_name,
                'guardian_phone' => $admission->guardian_phone ?? $admission->father_phone,
                'active' => true,
            ];
            $parent = User::create($parentData);

            $admission->update([
                'is_enrolled' => true,
                'form_status' => 'Enrolled'
            ]);

            DB::commit();

            \App\Services\NotificationDispatcher::dispatch('Student Admission', [
                'firstname' => $user->first_name ?? $admission->first_name ?? '',
                'lastname' => $user->last_name ?? $admission->last_name ?? '',
                'admission_no' => $admissionNo ?? '',
                'roll_no' => $rollNo ?? '',
                'class' => $admission->schoolClass?->name ?? '',
                'section' => $admission->section?->name ?? '',
                'username' => $studentUsername ?? '',
                'password' => $admissionNo ?? '',
            ], [
                'email' => $user->email ?? $admission->email ?? '',
                'phone' => $user->phone ?? $admission->phone ?? '',
                'student_id' => $user->id ?? null,
            ]);

            $message = "Applicant enrolled successfully as Student with Admission No: {$admissionNo}";
            if ($rollNo) {
                $message .= " and Roll No: {$rollNo}";
            }

            return $this->success(
                $user->load(['schoolClass', 'section']),
                $message
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to enroll: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generate Admission No based on settings.
     */
    private function generateAdmissionNo($settings)
    {
        if (!$settings || !$settings->auto_admission_no) {
            // Default random if auto is disabled
            $admissionNo = 'ADM-' . strtoupper(Str::random(6));
            while (User::where('admission_no', $admissionNo)->exists()) {
                $admissionNo = 'ADM-' . strtoupper(Str::random(6));
            }
            return $admissionNo;
        }

        $prefix = $settings->admission_no_prefix ?? '';
        $digits = $settings->admission_no_digit ?? 4;
        $startFrom = (int) ($settings->admission_start_from ?? 1);

        $lastStudent = User::where('role', 'Student')
            ->where('admission_no', 'like', $prefix . '%')
            ->orderByRaw('CAST(REPLACE(admission_no, ?, \'\') AS UNSIGNED) DESC', [$prefix])
            ->first();

        $nextNum = $startFrom;
        if ($lastStudent) {
            $numericPart = str_replace($prefix, '', $lastStudent->admission_no);
            if (is_numeric($numericPart)) {
                $nextNum = max($startFrom, (int) $numericPart + 1);
            }
        }

        return $prefix . str_pad($nextNum, $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Generate Roll No (Class & Section wise).
     */
    private function generateRollNo($settings, $classId, $sectionId)
    {
        $prefix = $settings->roll_no_prefix ?? '';
        $digits = $settings->roll_no_digit ?? 0;
        $startFrom = (int) ($settings->roll_no_start_from ?? 1);

        $lastStudent = User::where('role', 'Student')
            ->where('school_class_id', $classId)
            ->where('section_id', $sectionId)
            ->where('roll_no', 'like', $prefix . '%')
            ->orderByRaw('CAST(REPLACE(roll_no, ?, \'\') AS UNSIGNED) DESC', [$prefix])
            ->first();

        $nextNum = $startFrom;
        if ($lastStudent) {
            $numericPart = str_replace($prefix, '', $lastStudent->roll_no);
            if (is_numeric($numericPart)) {
                $nextNum = max($startFrom, (int) $numericPart + 1);
            }
        }

        return $prefix . ($digits > 0 ? str_pad($nextNum, $digits, '0', STR_PAD_LEFT) : $nextNum);
    }

    /**
     * Generate username based on settings and type (student/parent).
     */
    private function generateUsername($settings, string $type = 'student'): string
    {
        if ($type === 'parent') {
            $prefix = $settings->parent_username_prefix ?? '';
            $digits = $settings->parent_username_digit ?? 4;
            $startFrom = (int) ($settings->parent_username_start_from ?? 1);
        } else {
            $prefix = $settings->username_prefix ?? '';
            $digits = $settings->username_digit ?? 4;
            $startFrom = (int) ($settings->username_start_from ?? 1);
        }

        $lastUser = User::where('username', 'like', $prefix . '%')
            ->orderByRaw('CAST(REPLACE(username, ?, \'\') AS UNSIGNED) DESC', [$prefix])
            ->first();

        $nextNum = $startFrom;
        if ($lastUser) {
            $numericPart = str_replace($prefix, '', $lastUser->username);
            if (is_numeric($numericPart)) {
                $nextNum = max($startFrom, (int) $numericPart + 1);
            }
        }

        return $prefix . str_pad($nextNum, $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Delete an admission record.
     */
    public function destroy($id): JsonResponse
    {
        $admission = OnlineAdmission::findOrFail($id);
        $admission->delete();

        return $this->success(null, 'Admission record deleted successfully');
    }

    /**
     * Store a new online admission application.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'dob' => 'required|date',
            'gender' => 'required|string',
            'father_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'category' => 'nullable|string',
            'religion' => 'nullable|string',
            'caste' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'house' => 'nullable|string',
            'height' => 'nullable|string',
            'weight' => 'nullable|string',
            'measurement_date' => 'nullable|date',
            'father_phone' => 'nullable|string',
            'father_occupation' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'mother_phone' => 'nullable|string',
            'mother_occupation' => 'nullable|string',
            'guardian_type' => 'nullable|string',
            'guardian_name' => 'nullable|string',
            'guardian_relation' => 'nullable|string',
            'guardian_phone' => 'nullable|string',
            'guardian_email' => 'nullable|email',
            'guardian_occupation' => 'nullable|string',
            'guardian_address' => 'nullable|string',
            'current_address' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'student_photo' => 'nullable|image|max:2048',
            'national_identification_no' => 'nullable|string',
            'local_identification_no' => 'nullable|string',
            'birth_place' => 'nullable|string',
            'state' => 'nullable|string',
            'nationality' => 'nullable|string',
            'mother_tongue' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'bank_account_no' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'ifsc_code' => 'nullable|string',
            'previous_school_details' => 'nullable|string',
            'previous_academic_record' => 'nullable|array',
            'note' => 'nullable|string',
            'rte' => 'nullable|string',
            'appraisal_achievements' => 'nullable|string',
            'general_behaviour' => 'nullable|string',
            'second_language' => 'nullable|string',
            'identification_marks' => 'nullable|string',
            'medical_history' => 'nullable|string',
        ]);

        if ($request->hasFile('student_photo')) {
            $path = $request->file('student_photo')->store('online-admissions', 'public');
            $validated['student_photo'] = $path;
        }

        $activeSession = AcademicSession::where('is_active', true)->first();
        if (!$activeSession) {
            return $this->error('No active academic session found', 500);
        }

        $validated['academic_session_id'] = $activeSession->id;
        $validated['form_status'] = 'Submitted';
        $validated['payment_status'] = 'Unpaid';
        $validated['is_enrolled'] = false;

        // Generate reference number
        $date = Carbon::now()->format('Ymd');
        $lastAdmission = OnlineAdmission::whereDate('created_at', Carbon::today())->latest()->first();
        $sequence = 1;
        if ($lastAdmission && preg_match('/-(\d{4})$/', $lastAdmission->reference_no, $matches)) {
            $sequence = (int)$matches[1] + 1;
        }
        $validated['reference_no'] = 'ADM-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);

        $admission = OnlineAdmission::create($validated);
        $admission->load(['schoolClass', 'section']);

        // Send Notifications
        $this->notificationService->notifySubmission($admission);
        \App\Services\NotificationDispatcher::dispatch('Online Admission Form Submission', [
            'firstname' => $admission->first_name ?? '',
            'lastname' => $admission->last_name ?? '',
            'date' => $admission->created_at ? $admission->created_at->format('d/m/Y') : date('d/m/Y'),
            'reference_no' => $admission->reference_no ?? '',
            'class' => $admission->schoolClass?->name ?? '',
            'section' => $admission->section?->name ?? '',
        ], [
            'email' => $admission->email ?? '',
            'phone' => $admission->phone ?? '',
        ]);
        \App\Services\NotificationDispatcher::dispatch('Online Admission Fees Submission', [
            'firstname' => $admission->first_name ?? '',
            'lastname' => $admission->last_name ?? '',
            'paid_amount' => $admission->paid_amount ?? '0',
            'date' => $admission->created_at ? $admission->created_at->format('d/m/Y') : date('d/m/Y'),
            'reference_no' => $admission->reference_no ?? '',
        ], [
            'email' => $admission->email ?? '',
            'phone' => $admission->phone ?? '',
            'student_id' => null,
        ]);

        return $this->success($admission, 'Admission application submitted successfully', 201);
    }

    /**
     * Process mock payment for admission fees.
     */
    public function processPayment(Request $request, $id): JsonResponse
    {
        $admission = OnlineAdmission::findOrFail($id);
        
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'transaction_id' => 'required|string',
        ]);

        $admission->update([
            'payment_status' => 'Paid',
            'paid_amount' => $validated['amount'],
            'form_status' => 'Paid',
        ]);

        // Send Payment Success Notification
        $this->notificationService->notifyPaymentSuccess($admission);
        \App\Services\NotificationDispatcher::dispatch('Online Admission Fees Processing', [
            'firstname' => $admission->first_name ?? '',
            'lastname' => $admission->last_name ?? '',
            'paid_amount' => $validated['amount'],
            'date' => now()->format('d/m/Y'),
            'reference_no' => $admission->reference_no ?? '',
            'transaction_id' => $validated['transaction_id'] ?? '',
        ], [
            'email' => $admission->email ?? '',
            'phone' => $admission->phone ?? '',
        ]);

        return $this->success($admission, 'Payment processed successfully');
    }

    /**
     * Track an admission application by reference number.
     */
    public function track($reference_no): JsonResponse
    {
        $admission = OnlineAdmission::with(['schoolClass', 'section'])
            ->where('reference_no', $reference_no)
            ->first();

        if (!$admission) {
            return $this->error('No application found with the provided reference number', 404);
        }

        return $this->success($admission, 'Application tracked successfully');
    }
}
