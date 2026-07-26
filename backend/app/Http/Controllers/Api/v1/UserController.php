<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use App\Models\GeneralSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class UserController extends BaseController
{
    /**
     * List users with optional role filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role')) {
            if ($request->role === 'Staff') {
                $query->whereNotIn('role', ['Student', 'Parent']);
            } else {
                $query->where('role', $request->role);
            }
        }

        if ($request->role === 'Student') {
            $query->with(['schoolClass', 'section']);
        } elseif ($request->role === 'Parent') {
            $query->with(['linkedStudent.schoolClass', 'linkedStudent.section']);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate($request->get('limit', 50));

        // Fallback: for Parent users without linked_student_id, look up via parent_username on student record
        if ($request->role === 'Parent') {
            $users->getCollection()->transform(function ($user) {
                if (!$user->linkedStudent && !empty($user->username)) {
                    $student = User::with(['schoolClass', 'section'])->where('parent_username', $user->username)->first();
                    if ($student) {
                        $user->setRelation('linkedStudent', $student);
                    }
                }
                return $user;
            });
        }

        return $this->success($users, 'Users retrieved successfully');
    }

    /**
     * Get authenticated user profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->avatar && !str_starts_with($user->avatar, 'http')) {
            $user->avatar = url('storage/' . $user->avatar);
        }
        return $this->success($user, 'User profile retrieved successfully');
    }

    /**
     * Store a newly created user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['Admin', 'Staff', 'Student', 'Parent', 'Teacher', 'Driver'])],
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'admission_no' => 'nullable|string|max:50',
            'username' => 'nullable|string|max:50|unique:users',
            'class' => 'nullable|string|max:100',
            'father_name' => 'nullable|string|max:255',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'staff_id' => 'nullable|string|max:50',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'active' => 'nullable|boolean',
            'linked_student_id' => 'nullable|integer|exists:users,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        }

        $user = User::create($validated);

        return $this->success($user, 'User created successfully', 201);
    }

    /**
     * Update the specified user.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:8',
            'role' => ['sometimes', Rule::in(['Admin', 'Staff', 'Student', 'Parent', 'Teacher', 'Driver'])],
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'admission_no' => 'nullable|string|max:50',
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'class' => 'nullable|string|max:100',
            'father_name' => 'nullable|string|max:255',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'staff_id' => 'nullable|string|max:50',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'active' => 'sometimes|boolean',
            'linked_student_id' => 'nullable|integer|exists:users,id',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        }

        $user->update($validated);

        return $this->success($user, 'User updated successfully');
    }

    /**
     * Remove the specified user.
     *
     * @param User $user
     * @return JsonResponse
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return $this->success(null, 'User deleted successfully');
    }
    
    /**
     * Update authenticated user password.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->error('The provided current password does not match your record.', 422, [
                'current_password' => ['The current password is incorrect.']
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return $this->success(null, 'Password updated successfully');
    }

    /**
     * Admin force reset user password.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function adminResetPassword(Request $request, User $user): JsonResponse
    {
        // Check if the authenticated user is Admin or Super Admin
        $authUser = $request->user();
        if (!in_array($authUser->role, ['Admin', 'Super Admin'])) {
            return $this->error('Unauthorized. Only Admins can reset user passwords.', 403);
        }

        $validated = $request->validate([
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return $this->success(null, "Password for user {$user->name} reset successfully");
    }

    /**
     * Generate parent username.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generateParentUsername(Request $request): JsonResponse
    {
        $settings = GeneralSetting::first();

        if (!$settings || !$settings->auto_parent_username) {
            return $this->success(['username' => '', 'auto_enabled' => false], 'Auto parent username is disabled');
        }

        $prefix = $settings->parent_username_prefix ?? 'PAR';
        $digits = $settings->parent_username_digit ?? 4;
        $startFrom = (int) ($settings->parent_username_start_from ?? 1);

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

        $username = $prefix . str_pad($nextNum, $digits, '0', STR_PAD_LEFT);

        return $this->success(['username' => $username, 'auto_enabled' => true], 'Parent username generated');
    }
}
