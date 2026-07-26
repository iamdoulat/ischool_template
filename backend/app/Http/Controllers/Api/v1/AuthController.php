<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseController
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Login API
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email_or_username' => 'required|string',
            'password' => 'required',
        ]);

        try {
            $data = $this->authService->login($credentials);
            return $this->success($data, 'Login successful');
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }
    }

    /**
     * Logout API
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());
        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Profile API
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function profile(Request $request): JsonResponse
    {
        return $this->success($request->user(), 'User profile retrieved');
    }

    /**
     * Forgot Password API - sends reset link via email
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email_or_username' => 'required|string',
        ]);

        try {
            $this->authService->forgotPassword($request->email_or_username);
            return $this->success(null, 'If the account exists, a password reset link has been sent to your email.');
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        } catch (\Exception $e) {
            $message = config('app.debug') ? $e->getMessage() : 'Failed to send reset email. Please try again later.';
            return $this->error($message, 500);
        }
    }

    /**
     * Reset Password API
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_or_username' => 'required|string',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $this->authService->resetPassword($validated);
            return $this->success(null, 'Password has been reset successfully');
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }
    }
}
