<?php

namespace App\Http\Controllers\Api\v1\HumanResource;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\StaffResetPasswordMail;

class StaffController extends BaseController
{
    /**
     * Display a listing of staff.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $keyword = $request->input('keyword');
        $role = $request->input('role');
        $active = $request->input('active');

        $query = User::query();

        // Exclude Students and Parents from Staff Directory
        $query->whereNotIn('role', ['Student', 'Parent']);

        if ($active !== null && $active !== 'all') {
            $isActive = filter_var($active, FILTER_VALIDATE_BOOLEAN);
            $query->where('active', $isActive);
        } elseif ($active === null) {
            // Default: show only active staff
            $query->where('active', true);
        }
        // if $active === 'all', no filter applied

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('staff_id', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%");
            });
        }

        if ($role && $role !== 'Select' && $role !== 'all') {
            $query->where('role', $role);
        }

        $staff = $query->latest()->get()->map(function ($item) {
            $names = explode(' ', $item->name);
            $item->first_name = $names[0] ?? $item->name;
            $item->last_name = $names[count($names) - 1] ?? '';
            return $item;
        });

        return $this->success($staff, 'Staff list retrieved successfully');
    }

    /**
     * Get available roles for staff.
     *
     * @return JsonResponse
     */
    public function getRoles(): JsonResponse
    {
        $roles = DB::table('roles')
            ->whereNotIn('name', ['Student', 'Parent'])
            ->select('name')
            ->get();

        return $this->success($roles, 'Roles retrieved successfully');
    }

    /**
     * Get the next available staff ID based on auto-generation settings.
     *
     * @return JsonResponse
     */
    public function getNextStaffId(): JsonResponse
    {
        $setting = \App\Models\GeneralSetting::first();
        if (!$setting) {
            return $this->success([
                'staff_id' => '',
                'auto_staff_id' => false
            ], 'Settings not found');
        }

        $prefix = $setting->staff_id_prefix ?? '';
        $digits = (int)($setting->staff_no_digit ?? 4);
        $startFrom = (int)($setting->staff_id_start_from ?? 1);

        // Find the latest staff member with this prefix
        $latestStaff = User::whereNotIn('role', ['Student', 'Parent'])
            ->where('staff_id', 'like', $prefix . '%')
            ->orderByRaw('LENGTH(staff_id) DESC')
            ->orderBy('staff_id', 'desc')
            ->first();

        \Log::info('Next Staff ID Debug', [
            'prefix' => $prefix,
            'latestStaff' => $latestStaff ? $latestStaff->staff_id : 'none',
            'startFrom' => $startFrom
        ]);

        if ($latestStaff) {
            $currentId = $latestStaff->staff_id;
            // Remove prefix to get numeric part
            $numericPart = substr($currentId, strlen($prefix));
            if (preg_match('/(\d+)/', $numericPart, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            } else {
                $nextNumber = $startFrom;
            }
        } else {
            $nextNumber = $startFrom;
        }

        // Ensure next number is at least the startFrom value
        if ($nextNumber < $startFrom) {
            $nextNumber = $startFrom;
        }

        \Log::info('Next Staff ID Result', ['nextNumber' => $nextNumber]);

        $staffId = $prefix . str_pad((string)$nextNumber, $digits, '0', STR_PAD_LEFT);

        return $this->success([
            'staff_id' => $staffId,
            'auto_staff_id' => (bool)$setting->auto_staff_id,
            'settings' => [
                'prefix' => $prefix,
                'digits' => $digits,
                'start_from' => $startFrom
            ]
        ], 'Next staff ID fetched');
    }

    /**
     * Display the specified staff member.
     *
     * @param string|int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $staff = $this->resolveStaff($id);
            
            // Map DB columns to frontend fields
            $staff->first_name = explode(' ', $staff->name)[0] ?? $staff->name;
            $staff->date_of_birth = $staff->dob;
            $staff->date_of_joining = $staff->admission_date;
            $staff->emergency_contact = $staff->guardian_phone;
            $staff->address = $staff->current_address;
            $staff->pan_number = $staff->national_identification_no;
            
            return $this->success($staff, 'Staff details retrieved successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Staff member not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve staff details: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new staff member.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        if (!$this->checkAccess('human-resource.staff.add')) {
            return $this->error('Unauthorized. You do not have permission to add staff.', 403);
        }

        $validated = $request->validate([
            'staff_id' => 'required|string|unique:users,staff_id',
            'role' => 'required|string',
            'designation' => 'nullable|string',
            'department' => 'nullable|string',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'date_of_birth' => 'nullable|date',
            'date_of_joining' => 'nullable|date',
            'phone' => 'nullable|string',
            'emergency_contact' => 'nullable|string',
            'marital_status' => 'nullable|string|in:Single,Married,Divorced,Widowed',
            'avatar' => 'nullable|string',
            'address' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'qualification' => 'nullable|string',
            'work_experience' => 'nullable|string',
            'note' => 'nullable|string',
            'pan_number' => 'nullable|string',
            'basic_salary' => 'nullable|numeric',
            'house_rent' => 'nullable|numeric',
            'medical_allowance' => 'nullable|numeric',
            'conveyance_allowance' => 'nullable|numeric',
            'food_allowance' => 'nullable|numeric',
        ]);

        // Generate random secure password
        $password = $this->generateSecurePassword();

        // Combine first name and last name for full name
        $fullName = $validated['first_name'] . (!empty($validated['last_name']) ? ' ' . $validated['last_name'] : '');

        // Create staff mapping UI fields to available DB columns
        $staff = User::create([
            'staff_id' => $validated['staff_id'],
            'name' => $fullName,
            'last_name' => $validated['last_name'] ?? null,
            'father_name' => $validated['father_name'] ?? null,
            'mother_name' => $validated['mother_name'] ?? null,
            'email' => $validated['email'],
            'gender' => $validated['gender'] ?? null,
            'dob' => $validated['date_of_birth'] ?? null,
            'admission_date' => $validated['date_of_joining'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'guardian_phone' => $validated['emergency_contact'] ?? null,
            'role' => $validated['role'],
            'department' => $validated['department'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'avatar' => $validated['avatar'] ?? null,
            'current_address' => $validated['address'] ?? null,
            'permanent_address' => $validated['permanent_address'] ?? null,
            'note' => $validated['note'] ?? null,
            'national_identification_no' => $validated['pan_number'] ?? null,
            'basic_salary' => $validated['basic_salary'] ?? null,
            'house_rent' => $validated['house_rent'] ?? null,
            'medical_allowance' => $validated['medical_allowance'] ?? null,
            'conveyance_allowance' => $validated['conveyance_allowance'] ?? null,
            'food_allowance' => $validated['food_allowance'] ?? null,
            'password' => bcrypt($password),
            'active' => true,
        ]);

        // TODO: Send email with credentials to staff
        // Mail::to($staff->email)->send(new StaffCredentialsMail($staff, $password));

        return $this->success([
            'staff' => $staff,
            'message' => 'Staff created successfully. Login credentials will be sent to their email.',
        ], 'Staff created successfully', 201);
    }

    /**
     * Update an existing staff member.
     *
     * @param Request $request
     * @param string|int $id
     * @return JsonResponse
     */

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $staff = $this->resolveStaff($id);

            // Access Control: Allow if user has permission OR is updating their own profile
            if (!$this->checkAccess('human-resource.staff.edit') && auth()->id() !== $staff->id) {
                return $this->error('Unauthorized. You do not have permission to edit staff.', 403);
            }

            $numericId = $staff->id;

            $validated = $request->validate([
                'staff_id' => 'sometimes|required|string|unique:users,staff_id,' . $numericId,
                'role' => 'sometimes|required|string',
                'designation' => 'nullable|string',
                'department' => 'nullable|string',
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'father_name' => 'nullable|string|max:255',
                'mother_name' => 'nullable|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $numericId,
                'gender' => 'nullable|string|in:Male,Female,Other',
                'date_of_birth' => 'nullable|date',
                'date_of_joining' => 'nullable|date',
                'phone' => 'nullable|string',
                'emergency_contact' => 'nullable|string',
                'marital_status' => 'nullable|string|in:Single,Married,Divorced,Widowed',
                'avatar' => 'nullable|string',
                'address' => 'nullable|string',
                'permanent_address' => 'nullable|string',
                'qualification' => 'nullable|string',
                'work_experience' => 'nullable|string',
                'note' => 'nullable|string',
                'pan_number' => 'nullable|string',
                'active' => 'sometimes|boolean',
                'basic_salary' => 'nullable|numeric',
                'house_rent' => 'nullable|numeric',
                'medical_allowance' => 'nullable|numeric',
                'conveyance_allowance' => 'nullable|numeric',
                'food_allowance' => 'nullable|numeric',
            ]);

            // Update full name if first_name or last_name changed
            if (array_key_exists('first_name', $validated) || array_key_exists('last_name', $validated)) {
                $firstName = $validated['first_name'] ?? explode(' ', $staff->name)[0];
                $lastName = $validated['last_name'] ?? $staff->last_name;
                $validated['name'] = $firstName . (!empty($lastName) ? ' ' . $lastName : '');
            }

            // Map frontend fields to DB columns
            if (array_key_exists('date_of_birth', $validated)) {
                $validated['dob'] = $validated['date_of_birth'];
            }
            if (array_key_exists('date_of_joining', $validated)) {
                $validated['admission_date'] = $validated['date_of_joining'];
            }
            if (array_key_exists('address', $validated)) {
                $validated['current_address'] = $validated['address'];
            }
            if (array_key_exists('pan_number', $validated)) {
                $validated['national_identification_no'] = $validated['pan_number'];
            }
            if (array_key_exists('emergency_contact', $validated)) {
                $validated['guardian_phone'] = $validated['emergency_contact'];
            }

            // Remove non-db fields from $validated before update
            unset(
                $validated['first_name'], 
                $validated['date_of_birth'], 
                $validated['date_of_joining'], 
                $validated['address'], 
                $validated['pan_number'], 
                $validated['emergency_contact'], 
                $validated['marital_status'], 
                $validated['qualification'], 
                $validated['work_experience']
            );

            $staff->update($validated);

            return $this->success($staff, 'Staff updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Staff member not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to update staff: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a staff member.
     *
     * @param string|int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        if (!$this->checkAccess('human-resource.staff.delete')) {
            return $this->error('Unauthorized. You do not have permission to delete staff.', 403);
        }

        try {
            $staff = $this->resolveStaff($id);

            // Optional: Prevent deletion of certain roles
            // if (in_array($staff->role, ['Super Admin'])) {
            //     return $this->error('Cannot delete this staff member', 403);
            // }

            $staff->delete();

            return $this->success(null, 'Staff deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Staff member not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to delete staff: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send password reset link to staff email.
     *
     * @param string|int $id
     * @return JsonResponse
     */
    public function sendPasswordResetLink($id): JsonResponse
    {
        if (!$this->checkAccess('human-resource.staff.edit')) { // Using edit permission for password reset
            return $this->error('Unauthorized. You do not have permission to trigger password resets.', 403);
        }

        try {
            $staff = $this->resolveStaff($id);

            // Generate token
            $token = Str::random(64);

            // Save to password_reset_tokens
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $staff->email],
                [
                    'token' => $token,
                    'created_at' => now()
                ]
            );

            // Construct Reset URL (Frontend URL)
            // Using localhost:3000 as default for Next.js dev environment
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($staff->email);

            // Send Email
            Mail::to($staff->email)->send(new StaffResetPasswordMail($staff, $resetUrl));

            return $this->success(null, 'Password reset link sent successfully to ' . $staff->email);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Staff member not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to send reset link: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Resolve staff by ID or Staff ID.
     *
     * @param string|int $id
     * @return User
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    private function resolveStaff($id): User
    {
        return User::where(function ($query) use ($id) {
            $query->where('id', $id)->orWhere('staff_id', $id);
        })->firstOrFail();
    }

    /**
     * Check if the authenticated user has specific permission.
     *
     * @param string $permission
     * @return bool
     */
    private function checkAccess(string $permission): bool
    {
        return auth()->user() && auth()->user()->hasPermission($permission);
    }

    /**
     * Generate a secure random password.
     *
     * @return string
     */
    private function generateSecurePassword(): string
    {
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';

        for ($i = 0; $i < 12; $i++) {
            $password .= $characters[random_int(0, strlen($characters) - 1)];
        }

        return $password;
    }
}
