<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NotificationSetting;
use Illuminate\Http\JsonResponse;

class NotificationSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $expectedEvents = [
            'Salary Generated' => "Dear {{name}}, your salary of {{net_salary}} for {{month_name}} {{year}} has been generated. Basic: {{basic_salary}}, Allowances: {{allowances}}, Deductions: {{deductions}}.",
            'Salary Paid' => "Dear {{name}}, your salary of {{net_salary}} for {{month_name}} {{year}} has been paid on {{paid_on}}."
        ];

        foreach ($expectedEvents as $eventName => $sampleMessage) {
            if (!NotificationSetting::where('event_name', $eventName)->exists()) {
                NotificationSetting::create([
                    'event_name' => $eventName,
                    'is_active' => true,
                    'destinations' => ["Email", "SMS", "Mobile App", "WhatsApp"],
                    'recipients' => ["Staff"],
                    'sample_message' => $sampleMessage
                ]);
            }
        }

        $settings = NotificationSetting::all();
        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Update multiple notification settings at once.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:notification_settings,id',
            'settings.*.destinations' => 'nullable|array',
            'settings.*.recipients' => 'nullable|array',
            'settings.*.sms_template_id' => 'nullable|string',
            'settings.*.whatsapp_template_id' => 'nullable|string',
            'settings.*.sample_message' => 'nullable|string',
            'settings.*.email_subject' => 'nullable|string',
            'settings.*.email_template' => 'nullable|string',
            'settings.*.sms_template' => 'nullable|string',
            'settings.*.whatsapp_template' => 'nullable|string',
            'settings.*.mobile_app_template' => 'nullable|string',
            'settings.*.is_active' => 'nullable|boolean',
        ]);

        foreach ($request->settings as $settingData) {
            $setting = NotificationSetting::find($settingData['id']);
            $setting->update($settingData);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Notification settings updated successfully'
        ]);
    }
}
