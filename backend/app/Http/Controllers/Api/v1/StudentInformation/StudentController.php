<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\GeneralSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StudentController extends BaseController
{
    /**
     * List students with filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->where('role', 'Student');

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->filled('category')) {
            $query->where(function ($q) use ($request) {
                $q->where('category', $request->category)
                  ->orWhere('student_category_id', $request->category);
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('active', true);
            } elseif ($request->status === 'disabled') {
                $query->where('active', false);
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere(DB::raw("CONCAT(name, ' ', IFNULL(last_name, ''))"), 'like', "%{$search}%")
                    ->orWhere('admission_no', 'like', "%{$search}%")
                    ->orWhere('roll_no', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('father_name', 'like', "%{$search}%")
                    ->orWhere('mother_name', 'like', "%{$search}%")
                    ->orWhere('guardian_name', 'like', "%{$search}%");
            });
        }

        $students = $query->with(['schoolClass', 'section', 'studentCategory'])->latest()->paginate($request->get('limit', 50));

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Update the specified student.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $student = User::where('role', 'Student')->findOrFail($id);

        $validated = $request->validate([
            'admission_no' => ['required', 'string', 'max:50', Rule::unique('users')->ignore($student->id)],
            'roll_no' => 'nullable|string|max:50',
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'required|string',
            'dob' => 'required|date',
            'birth_place' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'category' => 'nullable|string',
            'religion' => 'nullable|string',
            'caste' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($student->id)],
            'admission_date' => 'nullable|date',
            'blood_group' => 'nullable|string',
            'house' => 'nullable|string',
            'height' => 'nullable|string',
            'weight' => 'nullable|string',
            'measurement_date' => 'nullable|date',
            'medical_history' => 'nullable|string',
            'postal_code' => 'nullable|string|max:20',
            'mother_tongue' => 'nullable|string|max:255',
            'identification_marks' => 'nullable|string',
            'father_name' => 'nullable|string|max:255',
            'father_phone' => 'nullable|string|max:20',
            'father_occupation' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_phone' => 'nullable|string|max:20',
            'mother_occupation' => 'nullable|string|max:255',
            'guardian_type' => 'nullable|string',
            'guardian_name' => 'required|string|max:255',
            'guardian_relation' => 'required|string|max:255',
            'guardian_phone' => 'required|string|max:20',
            'guardian_email' => 'nullable|email',
            'guardian_occupation' => 'nullable|string|max:255',
            'guardian_address' => 'nullable|string',
            'parent_username' => 'nullable|string|max:50',
            'current_address' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'bank_account_no' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'ifsc_code' => 'nullable|string',
            'national_identification_no' => 'nullable|string',
            'local_identification_no' => 'nullable|string',
            'rte' => 'nullable|string',
            'previous_school_details' => 'nullable|string',
            'previous_academic_record' => 'nullable|array',
            'note' => 'nullable|string',
            'appraisal_achievements' => 'nullable|string',
            'general_behaviour' => 'nullable|string|max:255',
            'second_language' => 'nullable|string|max:255',
            'active' => 'nullable|boolean',
            'disable_reason' => 'nullable|string',
            'disable_date' => 'nullable|date',
            // Photos
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'father_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'mother_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'guardian_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'fees_groups' => 'nullable|array',
            'fees_groups.*' => 'exists:fee_groups,id',
            'fees_discounts' => 'nullable|array',
            'fees_discounts.*' => 'exists:fee_discounts,id',
            'transport_route_id' => 'nullable|exists:transport_routes,id',
            'transport_pickup_point_id' => 'nullable|exists:transport_pickup_points,id',
            'hostel_id' => 'nullable|exists:hostels,id',
            'room_id' => 'nullable|exists:rooms,id',
        ]);

        // Handle File Uploads & Base64 Photos
        $photoFields = ['avatar' => 'avatars', 'father_photo' => 'parents', 'mother_photo' => 'parents', 'guardian_photo' => 'guardians'];
        foreach ($photoFields as $field => $folder) {
            if (!Storage::disk('public')->exists($folder)) {
                Storage::disk('public')->makeDirectory($folder);
            }

            if ($request->hasFile($field)) {
                if ($student->$field) {
                    Storage::disk('public')->delete($student->$field);
                }
                $file = $request->file($field);
                $ext = $file->getClientOriginalExtension() ?: 'jpg';
                $filename = Str::random(40) . '.' . $ext;
                $path = $file->storeAs($folder, $filename, 'public');
                $validated[$field] = $path;

                // Sync directly to public_path directories for live servers without symlinks
                try {
                    $pubStorageDir = public_path('storage/' . $folder);
                    if (!file_exists($pubStorageDir)) @mkdir($pubStorageDir, 0777, true);
                    @copy($file->getRealPath(), $pubStorageDir . '/' . $filename);

                    $pubUploadsDir = public_path('uploads/' . $folder);
                    if (!file_exists($pubUploadsDir)) @mkdir($pubUploadsDir, 0777, true);
                    @copy($file->getRealPath(), $pubUploadsDir . '/' . $filename);
                } catch (\Throwable $e) {
                    // Ignore error
                }
            } elseif ($request->filled($field) && is_string($request->input($field)) && (Str::startsWith($request->input($field), 'data:image/') || strlen($request->input($field)) > 200)) {
                $dataUrl = $request->input($field);
                if (Str::startsWith($dataUrl, 'data:image/')) {
                    if ($student->$field) {
                        Storage::disk('public')->delete($student->$field);
                    }
                    @list($type, $data) = explode(';', $dataUrl);
                    @list(, $data) = explode(',', $data);
                    if ($data) {
                        $decodedData = base64_decode($data);
                        preg_match('/data:image\/(.*?);/', $dataUrl, $matches);
                        $ext = $matches[1] ?? 'jpg';
                        if ($ext === 'jpeg') $ext = 'jpg';
                        $filename = Str::random(40) . '.' . $ext;
                        $path = $folder . '/' . $filename;
                        Storage::disk('public')->put($path, $decodedData);
                        $validated[$field] = $path;

                        // Sync directly to public_path directories
                        try {
                            $pubStorageDir = public_path('storage/' . $folder);
                            if (!file_exists($pubStorageDir)) @mkdir($pubStorageDir, 0777, true);
                            @file_put_contents($pubStorageDir . '/' . $filename, $decodedData);

                            $pubUploadsDir = public_path('uploads/' . $folder);
                            if (!file_exists($pubUploadsDir)) @mkdir($pubUploadsDir, 0777, true);
                            @file_put_contents($pubUploadsDir . '/' . $filename, $decodedData);
                        } catch (\Throwable $e) {
                            // Ignore error
                        }
                    }
                }
            }
        }

        // Handle Disable logic
        if (isset($validated['active'])) {
            if (!$validated['active']) {
                // If disabling, set date if not provided and not already set
                if (empty($validated['disable_date']) && empty($student->disable_date)) {
                    $validated['disable_date'] = now()->toDateString();
                }
            } else {
                // If enabling, clear disable info
                $validated['disable_date'] = null;
                $validated['disable_reason'] = null;
            }
        }

        $oldParentUsername = $student->parent_username;

        $student->update($validated);

        if (!empty($validated['parent_username'])) {
            $existingParent = User::where('role', 'Parent')
                ->where(function ($q) use ($student, $oldParentUsername, $validated) {
                    $q->where('linked_student_id', $student->id);
                    if ($oldParentUsername) {
                        $q->orWhere('username', $oldParentUsername);
                    }
                    $q->orWhere('username', $validated['parent_username']);
                    if (!empty($validated['guardian_phone'])) {
                        $q->orWhere('phone', $validated['guardian_phone'])
                          ->orWhere('guardian_phone', $validated['guardian_phone']);
                    }
                    if (!empty($validated['guardian_email'])) {
                        $q->orWhere('email', $validated['guardian_email'])
                          ->orWhere('guardian_email', $validated['guardian_email']);
                    }
                })->first();

            if ($existingParent) {
                $existingParent->update([
                    'name' => $validated['guardian_name'] ?? $existingParent->name,
                    'email' => $validated['guardian_email'] ?? $existingParent->email,
                    'phone' => $validated['guardian_phone'] ?? $existingParent->phone,
                    'username' => $validated['parent_username'],
                    'guardian_name' => $validated['guardian_name'] ?? $existingParent->guardian_name,
                    'guardian_phone' => $validated['guardian_phone'] ?? $existingParent->guardian_phone,
                    'guardian_email' => $validated['guardian_email'] ?? $existingParent->guardian_email,
                    'linked_student_id' => $student->id,
                ]);
            } else {
                $parentPassword = Hash::make($validated['parent_username']);
                User::create([
                    'name' => $validated['guardian_name'] ?? $student->guardian_name ?? $student->father_name ?? 'Parent',
                    'email' => $validated['guardian_email'] ?? $student->guardian_email ?? null,
                    'phone' => $validated['guardian_phone'] ?? $student->guardian_phone ?? $student->father_phone ?? null,
                    'username' => $validated['parent_username'],
                    'password' => $parentPassword,
                    'role' => 'Parent',
                    'guardian_name' => $validated['guardian_name'] ?? $student->guardian_name ?? $student->father_name ?? null,
                    'guardian_phone' => $validated['guardian_phone'] ?? $student->guardian_phone ?? $student->father_phone ?? null,
                    'guardian_email' => $validated['guardian_email'] ?? $student->guardian_email ?? null,
                    'active' => true,
                    'linked_student_id' => $student->id,
                ]);
            }
        }

        if (isset($validated['fees_groups'])) {
            $student->feesGroups()->sync($validated['fees_groups']);
            $this->syncStudentFees($student, $validated['fees_groups']);
        }

        if (isset($validated['fees_discounts'])) {
            $student->feesDiscounts()->sync($validated['fees_discounts']);
        }

        // Handle Transport Assignment
        if ($request->filled('transport_route_id')) {
            // Find a vehicle for this route
            $vehicle = \DB::table('transport_route_vehicles')
                ->where('route_id', $request->transport_route_id)
                ->first();

            $student->transportAssignment()->updateOrCreate(
                ['student_id' => $student->id],
                [
                    'route_id' => $request->transport_route_id,
                    'pickup_point_id' => $request->transport_pickup_point_id,
                    'vehicle_id' => $vehicle ? $vehicle->vehicle_id : null,
                    'academic_session_id' => $student->academic_session_id,
                ]
            );
        } else {
            $student->transportAssignment()->delete();
        }

        return $this->success($student, 'Student updated successfully');
    }

    /**
     * Remove the specified student.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $student = User::where('role', 'Student')->findOrFail($id);
        
        // Delete photos from storage
        $photos = ['avatar', 'father_photo', 'mother_photo', 'guardian_photo'];
        foreach ($photos as $photo) {
            if ($student->$photo) {
                Storage::disk('public')->delete($student->$photo);
            }
        }

        $student->delete();

        return $this->success(null, 'Student deleted successfully');
    }

    /**
     * Generate next admission number based on general settings.
     */
    public function generateAdmissionNo(): JsonResponse
    {
        $settings = GeneralSetting::first();

        if (!$settings || !$settings->auto_admission_no) {
            return $this->success(['admission_no' => '', 'auto_enabled' => false], 'Auto admission number is disabled');
        }

        $admissionNo = $this->getNextAdmissionNo($settings);

        return $this->success(['admission_no' => $admissionNo, 'auto_enabled' => true], 'Admission number generated');
    }

    /**
     * Generate next roll number based on class and section.
     */
    public function generateRollNo(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
        ]);

        $settings = GeneralSetting::first();

        if (!$settings || !$settings->auto_roll_no) {
            return $this->success(['roll_no' => '', 'auto_enabled' => false], 'Auto roll number is disabled');
        }

        $rollNo = $this->getNextRollNo($request->school_class_id, $request->section_id);

        return $this->success(['roll_no' => $rollNo, 'auto_enabled' => true], 'Roll number generated');
    }

    /**
     * Generate the next username and parent username based on settings.
     */
    public function generateUsername(): JsonResponse
    {
        $settings = GeneralSetting::first();

        if (!$settings || !$settings->auto_username) {
            return $this->success(['username' => '', 'parent_username' => '', 'auto_enabled' => false], 'Auto username generation is disabled');
        }

        $username = $this->getNextUsername($settings);
        $parentUsername = $this->getNextParentUsername($settings);

        return $this->success([
            'username' => $username,
            'parent_username' => $parentUsername,
            'auto_enabled' => true,
        ], 'Username generated');
    }

    /**
     * Calculate the next student username from settings and existing data.
     */
    private function getNextUsername(GeneralSetting $settings): string
    {
        $prefix = $settings->username_prefix ?? '';
        $digits = $settings->username_digit ?? 4;
        $startFrom = (int) ($settings->username_start_from ?? 1);

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
     * Calculate the next parent username from settings and existing data.
     */
    private function getNextParentUsername(GeneralSetting $settings): string
    {
        $prefix = $settings->parent_username_prefix ?? '';
        $digits = $settings->parent_username_digit ?? 4;
        $startFrom = (int) ($settings->parent_username_start_from ?? 1);

        $lastUser = User::where('parent_username', 'like', $prefix . '%')
            ->orderByRaw('CAST(REPLACE(parent_username, ?, \'\') AS UNSIGNED) DESC', [$prefix])
            ->first();

        $nextNum = $startFrom;
        if ($lastUser) {
            $numericPart = str_replace($prefix, '', $lastUser->parent_username);
            if (is_numeric($numericPart)) {
                $nextNum = max($startFrom, (int) $numericPart + 1);
            }
        }

        return $prefix . str_pad($nextNum, $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate the next roll number.
     */
    private function getNextRollNo($classId, $sectionId): string
    {
        $lastStudent = User::where('role', 'Student')
            ->where('school_class_id', $classId)
            ->where('section_id', $sectionId)
            ->whereNotNull('roll_no')
            ->orderByRaw('CAST(roll_no AS UNSIGNED) DESC')
            ->first();

        $nextRoll = 1;
        if ($lastStudent && is_numeric($lastStudent->roll_no)) {
            $nextRoll = (int) $lastStudent->roll_no + 1;
        }

        return (string) $nextRoll;
    }

    /**
     * Calculate the next admission number from settings and existing data.
     */
    private function getNextAdmissionNo(GeneralSetting $settings): string
    {
        $prefix = $settings->admission_no_prefix ?? '';
        $digits = $settings->admission_no_digit ?? 4;
        $startFrom = (int) ($settings->admission_start_from ?? 1);

        // Find the highest existing numeric part
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
     * Store a newly admitted student.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Auto-generate admission number if enabled and not provided
        $settings = GeneralSetting::first();
        if ($settings && $settings->auto_admission_no && !$request->filled('admission_no')) {
            $request->merge(['admission_no' => $this->getNextAdmissionNo($settings)]);
        }

        // Auto-generate roll number if enabled and not provided
        if ($settings && $settings->auto_roll_no && !$request->filled('roll_no') && $request->filled('school_class_id') && $request->filled('section_id')) {
            $request->merge(['roll_no' => $this->getNextRollNo($request->school_class_id, $request->section_id)]);
        }

        $validated = $request->validate([
            'admission_no' => 'required|string|max:50|unique:users',
            'roll_no' => 'nullable|string|max:50',
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'required|string',
            'dob' => 'required|date',
            'birth_place' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'category' => 'nullable|string',
            'religion' => 'nullable|string',
            'caste' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:users',
            'admission_date' => 'nullable|date',
            'blood_group' => 'nullable|string',
            'house' => 'nullable|string',
            'height' => 'nullable|string',
            'weight' => 'nullable|string',
            'measurement_date' => 'nullable|date',
            'medical_history' => 'nullable|string',
            'postal_code' => 'nullable|string|max:20',
            'mother_tongue' => 'nullable|string|max:255',
            'identification_marks' => 'nullable|string',
            // Parent / Guardian
            'father_name' => 'nullable|string|max:255',
            'father_phone' => 'nullable|string|max:20',
            'father_occupation' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_phone' => 'nullable|string|max:20',
            'mother_occupation' => 'nullable|string|max:255',
            'guardian_name' => 'required|string|max:255',
            'guardian_relation' => 'required|string|max:255',
            'guardian_phone' => 'required|string|max:20',
            'guardian_email' => 'nullable|email',
            'guardian_occupation' => 'nullable|string|max:255',
            'guardian_address' => 'nullable|string',
            'parent_username' => 'nullable|string|max:50|unique:users',
            'current_address' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'bank_account_no' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'ifsc_code' => 'nullable|string',
            'national_identification_no' => 'nullable|string',
            'local_identification_no' => 'nullable|string',
            'rte' => 'nullable|string',
            'previous_school_details' => 'nullable|string',
            'previous_academic_record' => 'nullable|array',
            'note' => 'nullable|string',
            'appraisal_achievements' => 'nullable|string',
            'general_behaviour' => 'nullable|string|max:255',
            'second_language' => 'nullable|string|max:255',
            // System fields
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            // Photos
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'father_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'mother_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'guardian_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'fees_groups' => 'nullable|array',
            'fees_groups.*' => 'exists:fee_groups,id',
            'fees_discounts' => 'nullable|array',
            'fees_discounts.*' => 'exists:fee_discounts,id',
            'transport_route_id' => 'nullable|exists:transport_routes,id',
            'transport_pickup_point_id' => 'nullable|exists:transport_pickup_points,id',
            'hostel_id' => 'nullable|exists:hostels,id',
            'room_id' => 'nullable|exists:rooms,id',
        ]);

        // Handle File Uploads & Base64 Photos
        $photoFields = ['avatar' => 'avatars', 'father_photo' => 'parents', 'mother_photo' => 'parents', 'guardian_photo' => 'guardians'];
        foreach ($photoFields as $field => $folder) {
            if (!Storage::disk('public')->exists($folder)) {
                Storage::disk('public')->makeDirectory($folder);
            }

            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $ext = $file->getClientOriginalExtension() ?: 'jpg';
                $filename = Str::random(40) . '.' . $ext;
                $path = $file->storeAs($folder, $filename, 'public');
                $validated[$field] = $path;

                // Sync directly to public_path directories for live servers without symlinks
                try {
                    $pubStorageDir = public_path('storage/' . $folder);
                    if (!file_exists($pubStorageDir)) @mkdir($pubStorageDir, 0777, true);
                    @copy($file->getRealPath(), $pubStorageDir . '/' . $filename);

                    $pubUploadsDir = public_path('uploads/' . $folder);
                    if (!file_exists($pubUploadsDir)) @mkdir($pubUploadsDir, 0777, true);
                    @copy($file->getRealPath(), $pubUploadsDir . '/' . $filename);
                } catch (\Throwable $e) {
                    // Ignore error
                }
            } elseif ($request->filled($field) && is_string($request->input($field)) && Str::startsWith($request->input($field), 'data:image/')) {
                $dataUrl = $request->input($field);
                @list($type, $data) = explode(';', $dataUrl);
                @list(, $data) = explode(',', $data);
                if ($data) {
                    $decodedData = base64_decode($data);
                    preg_match('/data:image\/(.*?);/', $dataUrl, $matches);
                    $ext = $matches[1] ?? 'jpg';
                    if ($ext === 'jpeg') $ext = 'jpg';
                    $filename = Str::random(40) . '.' . $ext;
                    $path = $folder . '/' . $filename;
                    Storage::disk('public')->put($path, $decodedData);
                    $validated[$field] = $path;

                    // Sync directly to public_path directories
                    try {
                        $pubStorageDir = public_path('storage/' . $folder);
                        if (!file_exists($pubStorageDir)) @mkdir($pubStorageDir, 0777, true);
                        @file_put_contents($pubStorageDir . '/' . $filename, $decodedData);

                        $pubUploadsDir = public_path('uploads/' . $folder);
                        if (!file_exists($pubUploadsDir)) @mkdir($pubUploadsDir, 0777, true);
                        @file_put_contents($pubUploadsDir . '/' . $filename, $decodedData);
                    } catch (\Throwable $e) {
                        // Ignore error
                    }
                }
            }
        }

        $validated['role'] = 'Student';
        $validated['password'] = Hash::make($validated['admission_no']); // Default password
        $validated['active'] = true;

        $student = User::create($validated);

        if (!empty($validated['parent_username'])) {
            $existingParent = User::where('role', 'Parent')
                ->where(function ($q) use ($student, $validated) {
                    $q->where('linked_student_id', $student->id);
                    $q->orWhere('username', $validated['parent_username']);
                    if (!empty($validated['guardian_phone'])) {
                        $q->orWhere('phone', $validated['guardian_phone'])
                          ->orWhere('guardian_phone', $validated['guardian_phone']);
                    }
                    if (!empty($validated['guardian_email'])) {
                        $q->orWhere('email', $validated['guardian_email'])
                          ->orWhere('guardian_email', $validated['guardian_email']);
                    }
                })->first();

            if ($existingParent) {
                $existingParent->update([
                    'name' => $validated['guardian_name'] ?? $existingParent->name,
                    'email' => $validated['guardian_email'] ?? $existingParent->email,
                    'phone' => $validated['guardian_phone'] ?? $existingParent->phone,
                    'username' => $validated['parent_username'],
                    'guardian_name' => $validated['guardian_name'] ?? $existingParent->guardian_name,
                    'guardian_phone' => $validated['guardian_phone'] ?? $existingParent->guardian_phone,
                    'guardian_email' => $validated['guardian_email'] ?? $existingParent->guardian_email,
                    'linked_student_id' => $student->id,
                ]);
            } else {
                $parentPassword = Hash::make($validated['parent_username']);
                User::create([
                    'name' => $validated['guardian_name'] ?? $validated['father_name'] ?? 'Parent',
                    'email' => $validated['guardian_email'] ?? null,
                    'phone' => $validated['guardian_phone'] ?? $validated['father_phone'] ?? null,
                    'username' => $validated['parent_username'],
                    'password' => $parentPassword,
                    'role' => 'Parent',
                    'guardian_name' => $validated['guardian_name'] ?? $validated['father_name'] ?? null,
                    'guardian_phone' => $validated['guardian_phone'] ?? $validated['father_phone'] ?? null,
                    'guardian_email' => $validated['guardian_email'] ?? null,
                    'active' => true,
                    'linked_student_id' => $student->id,
                ]);
            }
        }

        if (isset($validated['fees_groups'])) {
            $student->feesGroups()->sync($validated['fees_groups']);
            $this->syncStudentFees($student, $validated['fees_groups']);
        }
        
        if (isset($validated['fees_discounts'])) {
            $student->feesDiscounts()->sync($validated['fees_discounts']);
        }

        // Handle Transport Assignment
        if ($request->filled('transport_route_id')) {
            $vehicle = \DB::table('transport_route_vehicles')
                ->where('route_id', $request->transport_route_id)
                ->first();

            $student->transportAssignment()->create([
                'route_id' => $request->transport_route_id,
                'pickup_point_id' => $request->transport_pickup_point_id,
                'vehicle_id' => $vehicle ? $vehicle->vehicle_id : null,
                'academic_session_id' => $student->academic_session_id,
                'is_active' => true,
            ]);
        }

        return $this->success($student, 'Student admitted successfully', 201);
    }

    /**
     * Display the specified student.
     */
    public function show($id): JsonResponse
    {
        $student = User::with([
            'schoolClass',
            'section',
            'academicSession',
            'studentCategory',
            'feesGroups',
            'feesDiscounts',
            'transportAssignment.route',
            'transportAssignment.pickupPoint',
            'hostel',
            'room',
        ])
            ->where('role', 'Student')
            ->findOrFail($id);

        if ($student->transportAssignment) {
            $student->route_title = $student->transportAssignment->route?->title ?? $student->transportAssignment->route?->route_title ?? $student->transportAssignment->route?->name;
            $student->pickup_point_name = $student->transportAssignment->pickupPoint?->point_name ?? $student->transportAssignment->pickupPoint?->pickup_point_name ?? $student->transportAssignment->pickupPoint?->name;
            $student->transport_route_id = $student->transportAssignment->route_id;
            $student->transport_pickup_point_id = $student->transportAssignment->pickup_point_id;
        }

        if ($student->house && is_numeric($student->house)) {
            $houseModel = \App\Models\StudentHouse::find($student->house);
            if ($houseModel) {
                $student->house_name = $houseModel->house_name ?? $houseModel->name;
            }
        }

        // Fetch siblings (students with same guardian phone)
        $siblings = User::where('role', 'Student')
            ->where('id', '!=', $id)
            ->where('guardian_phone', $student->guardian_phone)
            ->whereNotNull('guardian_phone')
            ->with(['schoolClass', 'section'])
            ->get();
            
        $student->siblings = $siblings;

        return $this->success($student, 'Student details retrieved successfully');
    }

    /**
     * Import students from a CSV file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
            'file' => 'required|file|mimes:csv,txt,xlsx', // Add xlsx if needed, but CSV is standard
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        // Detect delimiter
        $fileHandle = fopen($path, 'r');
        $firstLine = fgets($fileHandle);
        fclose($fileHandle);
        $delimiter = strpos($firstLine, ';') !== false ? ';' : ',';

        $raw_data = array_map(function ($line) use ($delimiter) {
            return str_getcsv($line, $delimiter);
        }, file($path));

        if (count($raw_data) < 2) {
            return $this->error('The CSV file is empty or missing headers.', 400);
        }

        $headers = array_shift($raw_data);
        $headers = array_map('trim', $headers);

        $mapping = [
            'Admission No' => 'admission_no',
            'Roll No.' => 'roll_no',
            'First Name' => 'name',
            'Middle Name' => 'middle_name',
            'Last Name' => 'last_name',
            'Gender' => 'gender',
            'Date Of Birth' => 'dob',
            'Place Of Birth' => 'birth_place',
            'State' => 'state',
            'Nationality' => 'nationality',
            'Category' => 'category',
            'Religion' => 'religion',
            'Cast' => 'caste',
            'Mobile No.' => 'phone',
            'Email' => 'email',
            'Admission Date' => 'admission_date',
            'Blood Group' => 'blood_group',
            'House' => 'house',
            'Height' => 'height',
            'Weight' => 'weight',
            'Measurement Date' => 'measurement_date',
            'Postal / Zip Code' => 'postal_code',
            'Mother Tongue' => 'mother_tongue',
            'Identification Marks' => 'identification_marks',
            'Father Name' => 'father_name',
            'Father Phone' => 'father_phone',
            'Father Occupation' => 'father_occupation',
            'Mother Name' => 'mother_name',
            'Mother Phone' => 'mother_phone',
            'Mother Occupation' => 'mother_occupation',
            'If Guardian Is' => 'guardian_type',
            'Guardian Name' => 'guardian_name',
            'Guardian Relation' => 'guardian_relation',
            'Guardian Email' => 'guardian_email',
            'Guardian Phone' => 'guardian_phone',
            'Guardian Occupation' => 'guardian_occupation',
            'Guardian Address' => 'guardian_address',
            'Current Address' => 'current_address',
            'Permanent Address' => 'permanent_address',
            'Bank Account No' => 'bank_account_no',
            'Bank Name' => 'bank_name',
            'IFSC Code' => 'ifsc_code',
            'National Identification No' => 'national_identification_no',
            'Local Identification No' => 'local_identification_no',
            'RTE' => 'rte',
            'Previous School Details' => 'previous_school_details',
            'Note' => 'note',
        ];

        $importedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($raw_data as $index => $row) {
                if (empty(array_filter($row)))
                    continue; // Skip empty rows

                if (count($row) < count($headers)) {
                    $errors[] = "Row " . ($index + 2) . ": Column mismatch.";
                    continue;
                }

                $rowData = array_combine($headers, array_slice($row, 0, count($headers)));
                $studentData = [
                    'role' => 'Student',
                    'active' => true,
                    'school_class_id' => $request->school_class_id,
                    'section_id' => $request->section_id,
                    'academic_session_id' => $request->user()->academic_session_id ?? null,
                ];

                foreach ($mapping as $csvHeader => $dbField) {
                    if (isset($rowData[$csvHeader])) {
                        $val = trim($rowData[$csvHeader]);
                        if ($val !== "") {
                            $studentData[$dbField] = $val;
                        }
                    }
                }

                // Validation
                if (empty($studentData['name'])) {
                    $errors[] = "Row " . ($index + 2) . ": First Name is required.";
                    continue;
                }

                // Auto-generate admission_no if not provided and auto mode enabled
                $importSettings = GeneralSetting::first();
                if (empty($studentData['admission_no'])) {
                    if ($importSettings && $importSettings->auto_admission_no) {
                        $studentData['admission_no'] = $this->getNextAdmissionNo($importSettings);
                    } else {
                        $errors[] = "Row " . ($index + 2) . ": Admission No is required.";
                        continue;
                    }
                }

                if (User::where('admission_no', $studentData['admission_no'])->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Duplicate Admission No " . $studentData['admission_no'] . ".";
                    continue;
                }

                $studentData['password'] = Hash::make($studentData['admission_no']);

                User::create($studentData);
                $importedCount++;
            }

            if (count($errors) > 0 && $importedCount === 0) {
                DB::rollBack();
                return $this->error('No students were imported. Errors: ' . implode(' ', $errors), 400);
            }

            DB::commit();

            $message = "Successfully imported $importedCount students.";
            if (count($errors) > 0) {
                $message .= " However, " . count($errors) . " rows failed.";
            }

            return $this->success([
                'imported_count' => $importedCount,
                'errors' => $errors
            ], $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('An error occurred during import: ' . $e->getMessage(), 500);
        }
    }

    /**
     * List disabled students.
     */
    public function indexDisabled(Request $request): JsonResponse
    {
        $query = User::query()->where('role', 'Student')->where('active', false);

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere(DB::raw("CONCAT(name, ' ', IFNULL(last_name, ''))"), 'like', "%{$search}%")
                    ->orWhere('admission_no', 'like', "%{$search}%")
                    ->orWhere('roll_no', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $students = $query->with(['schoolClass', 'section', 'reason', 'studentCategory'])->latest()->paginate($request->get('limit', 50));

        return $this->success($students, 'Disabled students retrieved successfully');
    }

    /**
     * Toggle student active status.
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $student = User::where('role', 'Student')->findOrFail($id);

        $validated = $request->validate([
            'active' => 'required|boolean',
            'disable_reason' => 'nullable|string',
            'disable_date' => 'nullable|date',
        ]);

        $disableDate = $validated['active'] ? null : ($validated['disable_date'] ?? now()->toDateString());
        $disableReason = $validated['active'] ? null : $validated['disable_reason'];

        $student->update([
            'active' => $validated['active'],
            'disable_reason' => $disableReason,
            'disable_date' => $disableDate,
        ]);

        $status = $validated['active'] ? 'enabled' : 'disabled';
        return $this->success($student, "Student $status successfully");
    }

    /**
     * Bulk delete students.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
        ]);

        User::whereIn('id', $validated['ids'])->where('role', 'Student')->delete();

        return $this->success(null, 'Selected students deleted successfully');
    }

    /**
     * Sync student fee masters based on assigned fee groups.
     */
    private function syncStudentFees(User $student, array $feeGroupIds)
    {
        // Get all fee masters for these groups
        $feeMasters = \App\Models\FeeMaster::whereIn('fee_group_id', $feeGroupIds)->get();

        foreach ($feeMasters as $master) {
            \App\Models\StudentFeeMaster::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'fee_master_id' => $master->id,
                ],
                [
                    'academic_session_id' => $student->academic_session_id,
                    'is_active' => true,
                ]
            );
        }
    }
}
