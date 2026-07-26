<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\CaptchaSetting;
use Illuminate\Http\JsonResponse;

class CaptchaSettingController extends BaseController
{
    /**
     * Get all captcha settings (admin).
     */
    public function index(): JsonResponse
    {
        $settings = CaptchaSetting::orderBy('id', 'asc')->get();
        return $this->success($settings, 'Captcha settings fetched successfully');
    }

    /**
     * Toggle a captcha setting's active state.
     */
    public function toggle($id): JsonResponse
    {
        $setting = CaptchaSetting::findOrFail($id);
        $setting->is_active = ! $setting->is_active;
        $setting->save();

        return $this->success($setting, 'Captcha setting updated successfully');
    }

    /**
     * Public alias => bool map for front-end forms (login, admission, etc.).
     */
    public function publicMap(): JsonResponse
    {
        $map = CaptchaSetting::pluck('is_active', 'alias');
        return $this->success($map, 'Captcha settings fetched successfully');
    }
}
