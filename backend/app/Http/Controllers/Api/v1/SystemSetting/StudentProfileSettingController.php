<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\DashboardSetting;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileSettingController extends BaseController
{
    /**
     * Get settings.
     */
    public function index(): JsonResponse
    {
        $widgets = DashboardSetting::orderBy('id', 'asc')->get();
        $is_profile_edit = GeneralSetting::value('is_student_profile_edit');

        return $this->success([
            'widgets' => $widgets,
            'is_student_profile_edit' => (bool) $is_profile_edit,
        ], 'Settings fetched successfully');
    }

    /**
     * Update profile edit flag.
     */
    public function updateProfileEdit(Request $request): JsonResponse
    {
        $request->validate([
            'is_student_profile_edit' => 'required|boolean',
        ]);

        GeneralSetting::query()->update([
            'is_student_profile_edit' => $request->is_student_profile_edit
        ]);

        return $this->success(null, 'Profile edit setting updated successfully');
    }

    /**
     * Update dashboard widgets.
     */
    public function updateWidgets(Request $request): JsonResponse
    {
        $request->validate([
            'widgets' => 'required|array',
            'widgets.*.id' => 'required|integer|exists:dashboard_settings,id',
            'widgets.*.student' => 'required|boolean',
            'widgets.*.parent' => 'required|boolean',
        ]);

        foreach ($request->widgets as $widgetData) {
            DashboardSetting::where('id', $widgetData['id'])->update([
                'student' => $widgetData['student'],
                'parent' => $widgetData['parent'],
            ]);
        }

        return $this->success(null, 'Dashboard widgets updated successfully');
    }
}
