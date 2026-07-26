<?php

namespace App\Services;

use App\Models\NotificationSetting;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AppNotificationService
{
    /**
     * Dispatch an in-app notification based on a configured event.
     *
     * @param string $eventName The name of the event matching NotificationSetting.event_name
     * @param array $variables Key-value pairs to replace {{placeholders}} in the message
     * @param array $targetContext Context for resolving recipients:
     *        e.g., ['student_id' => 5, 'staff_id' => 10]
     */
    public static function dispatch(string $eventName, array $variables = [], array $targetContext = [])
    {
        try {
            $setting = NotificationSetting::where('event_name', $eventName)
                ->where('is_active', true)
                ->first();

            if (!$setting) {
                return;
            }

            // Check if Mobile App is in destinations
            $destinations = $setting->destinations ?? [];
            if (!in_array('Mobile App', $destinations)) {
                return; // In-app notification not enabled for this event
            }

            $recipients = $setting->recipients ?? [];
            $userIds = self::resolveUserIds($recipients, $targetContext);

            if (empty($userIds)) {
                return;
            }

            $messageBody = self::formatMessage($setting->mobile_app_template ?? $setting->sample_message ?? '', $variables);

            if (empty($messageBody)) {
                return;
            }

            $notifications = [];
            foreach (array_unique($userIds) as $userId) {
                $notifications[] = [
                    'user_id' => $userId,
                    'title' => $eventName,
                    'body' => $messageBody,
                    'type' => $eventName,
                    'data' => json_encode($variables),
                    'is_read' => false,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            if (!empty($notifications)) {
                AppNotification::insert($notifications);
            }
        } catch (\Exception $e) {
            Log::error("AppNotificationService Error: " . $e->getMessage(), [
                'event' => $eventName,
                'variables' => $variables
            ]);
        }
    }

    /**
     * Format message by replacing variables.
     */
    private static function formatMessage(string $message, array $variables): string
    {
        foreach ($variables as $key => $value) {
            // Replace e.g., {{firstname}} with actual value
            $message = str_replace('{{' . $key . '}}', is_scalar($value) ? (string)$value : '', $message);
        }
        return $message;
    }

    /**
     * Resolve actual user IDs based on the specified recipient roles and context.
     */
    private static function resolveUserIds(array $recipientRoles, array $context): array
    {
        $userIds = [];

        if (in_array('Student', $recipientRoles) && !empty($context['student_id'])) {
            // student_id provided is likely the User model ID if the system uses users for students
            // Let's assume $context['student_id'] refers to the user.id for the student role
            $userIds[] = $context['student_id'];
        }

        if (in_array('Guardian', $recipientRoles) && !empty($context['guardian_id'])) {
            // Similarly for guardian
            $userIds[] = $context['guardian_id'];
        }

        if (in_array('Staff', $recipientRoles) && !empty($context['staff_id'])) {
            $userIds[] = $context['staff_id'];
        }

        // If context provides user_id directly instead of role-specific ones
        if (!empty($context['user_id'])) {
            $userIds[] = $context['user_id'];
        }

        return $userIds;
    }
}
