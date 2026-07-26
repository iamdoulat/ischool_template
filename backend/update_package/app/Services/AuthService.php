<?php

namespace App\Services;

use App\Models\GeneralSetting;
use App\Models\User;
use App\Mail\ResetPasswordMail;
use App\Services\NotificationDispatcher;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Login user and generate token.
     *
     * @param array $credentials
     * @return array
     * @throws ValidationException
     */
    public function login(array $credentials): array
    {
        $input = $credentials['email_or_username'];
        $user = User::where('email', $input)->orWhere('username', $input)->orWhere('admission_no', $input)->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email_or_username' => ['The provided credentials are incorrect.'],
            ]);
        }

        $setting = GeneralSetting::first();
        if ($setting && $setting->maintenance_mode) {
            $allowedRoles = ['Super Admin', 'Admin'];
            if (!in_array($user->role, $allowedRoles)) {
                throw ValidationException::withMessages([
                    'email' => ['The system is currently under maintenance. Only administrators can log in.'],
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Logout user and revoke token.
     *
     * @param User $user
     * @return void
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Reset password using token.
     *
     * @param array $data
     * @return void
     * @throws ValidationException
     */
    public function resetPassword(array $data): void
    {
        $user = User::where('email', $data['email_or_username'])
            ->orWhere('username', $data['email_or_username'])
            ->orWhere('admission_no', $data['email_or_username'])
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email_or_username' => ['User not found.'],
            ]);
        }

        $email = $user->email;

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', $data['token'])
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'token' => ['Invalid token or email/username.'],
            ]);
        }

        // Check expiry (60 minutes)
        if (strtotime($record->created_at) < strtotime('-60 minutes')) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Reset token has expired.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($data['password']),
        ]);

        // Delete token
        DB::table('password_reset_tokens')->where('email', $email)->delete();
    }

    /**
     * Send forgot password email with reset token.
     *
     * @param string $email
     * @return void
     * @throws ValidationException
     */
    public function forgotPassword(string $emailOrUsername): void
    {
        $user = User::where('email', $emailOrUsername)
            ->orWhere('username', $emailOrUsername)
            ->orWhere('admission_no', $emailOrUsername)
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email_or_username' => ['We could not find a user with that email address or username.'],
            ]);
        }

        $email = $user->email;

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Generate a new token
        $token = Str::random(64);

        // Store the token
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => $token,
            'created_at' => now(),
        ]);

        // Send the email
        try {
            Mail::to($email)->send(new ResetPasswordMail($token, $email));

            NotificationDispatcher::dispatch('Forgot Password', [
                'name' => $user->name ?? '',
                'username' => $user->username ?? '',
            ], [
                'email' => $email ?? '',
                'phone' => $user->phone ?? '',
                'user_id' => $user->id ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send reset email: ' . $e->getMessage());
            throw $e;
        }
    }
}
