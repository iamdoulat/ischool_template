<?php

namespace App\Services;

use App\Models\NotificationSetting;
use App\Models\AppNotification;
use App\Models\User;
use App\Models\SmsSetting;
use App\Models\SmsLog;
use App\Models\WaLog;
use App\Models\EmailLog;
use App\Models\GeneralSetting;
use App\Mail\SendEmailMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationDispatcher
{
    /**
     * Dispatch a notification event to all configured destinations.
     *
     * @param string $eventName  Matches NotificationSetting.event_name
     * @param array  $variables  Key-value for {{placeholder}} replacement
     * @param array  $context    Recipient context: ['student_id'=>5, 'guardian_id'=>3, 'staff_id'=>10, 'email'=>'a@b.com', 'phone'=>'123']
     */
    public static function dispatch(string $eventName, array $variables = [], array $context = []): void
    {
        try {
            $setting = NotificationSetting::where('event_name', $eventName)
                ->where('is_active', true)
                ->first();

            if (!$setting) return;

            $destinations = $setting->destinations ?? [];
            $recipientRoles = $setting->recipients ?? [];

            if (empty($destinations)) return;

            if (in_array('Email', $destinations)) {
                $emailSubject = self::formatMessage($setting->email_subject ?? '', $variables);
                $emailMessage = self::formatMessage($setting->email_template ?? $setting->sample_message ?? '', $variables);
                if (!empty($emailMessage)) {
                    self::sendEmail($eventName, $emailSubject, $emailMessage, $recipientRoles, $context);
                }
            }

            if (in_array('SMS', $destinations)) {
                $smsMessage = self::formatMessage($setting->sms_template ?? $setting->sample_message ?? '', $variables);
                if (!empty($smsMessage)) {
                    self::sendSms($eventName, $smsMessage, $recipientRoles, $context, false);
                }
            }

            if (in_array('WhatsApp', $destinations)) {
                $waMessage = self::formatMessage($setting->whatsapp_template ?? $setting->sample_message ?? '', $variables);
                if (!empty($waMessage)) {
                    self::sendSms($eventName, $waMessage, $recipientRoles, $context, true);
                }
            }
        } catch (\Exception $e) {
            Log::error("NotificationDispatcher Error: " . $e->getMessage(), [
                'event' => $eventName,
                'variables' => $variables,
            ]);
        }
    }

    private static function formatMessage(string $message, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $message = str_replace(
                '{{' . $key . '}}',
                is_scalar($value) ? (string) $value : '',
                $message
            );
        }
        return $message;
    }

    private static function sendInApp(string $eventName, string $message, array $variables, array $recipientRoles, array $context): void
    {
        $userIds = self::resolveUserIds($recipientRoles, $context);
        if (empty($userIds)) return;

        $notifications = [];
        foreach (array_unique($userIds) as $userId) {
            $notifications[] = [
                'user_id'   => $userId,
                'title'     => $eventName,
                'body'      => $message,
                'type'      => $eventName,
                'data'      => json_encode($variables),
                'is_read'   => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($notifications)) {
            AppNotification::insert($notifications);
        }
    }

    private static function sendEmail(string $eventName, string $subject, string $message, array $recipientRoles, array $context): void
    {
        $emails = self::resolveEmails($recipientRoles, $context);

        if (!empty($context['email'])) {
            $emails[] = $context['email'];
        }

        $emails = array_unique(array_filter($emails));

        if (empty($emails)) return;

        $schoolName = GeneralSetting::first()->school_name ?? config('app.name');
        if (empty($subject)) {
            $subject = "{$schoolName} - {$eventName}";
        }

        $sent = 0;
        $failed = 0;

        foreach ($emails as $email) {
            try {
                Mail::to($email)->send(new SendEmailMail($subject, $message));
                $sent++;
            } catch (\Exception $e) {
                Log::error("NotificationDispatcher email failed to {$email}: " . $e->getMessage());
                $failed++;
            }
        }

        EmailLog::create([
            'title'     => $eventName,
            'message'   => $message,
            'recipients' => implode(',', $emails),
            'status'    => $failed > 0 ? 'partial' : 'sent',
        ]);

        Log::info("NotificationDispatcher Email: {$eventName} sent={$sent} failed={$failed}");
    }

    private static function sendSms(string $eventName, string $message, array $recipientRoles, array $context, bool $isWhatsApp): void
    {
        $phones = self::resolvePhones($recipientRoles, $context);

        if (!empty($context['phone'])) {
            $phones[] = $context['phone'];
        }

        $phones = array_unique(array_filter($phones));
        if (empty($phones)) return;

        $providerPrefix = $isWhatsApp ? 'whatsapp_' : '';
        $activeSetting = SmsSetting::where('provider', $isWhatsApp ? 'like' : 'not like', $isWhatsApp ? 'whatsapp_%' : 'whatsapp_%')
            ->where('status', true)
            ->first();

        if (!$activeSetting) {
            Log::warning("NotificationDispatcher: No active " . ($isWhatsApp ? 'WhatsApp' : 'SMS') . " gateway configured");
            return;
        }

        $smsController = new \App\Http\Controllers\Api\v1\SystemSetting\SmsSettingController();
        $successCount = 0;
        $failCount = 0;

        foreach ($phones as $phone) {
            try {
                $sent = $smsController->sendViaGateway($activeSetting->provider, $activeSetting->config, $phone, $message);
                if ($sent) {
                    $successCount++;
                } else {
                    $failCount++;
                }
            } catch (\Exception $e) {
                Log::error("NotificationDispatcher " . ($isWhatsApp ? 'WhatsApp' : 'SMS') . " failed to {$phone}: " . $e->getMessage());
                $failCount++;
            }
        }

        $logClass = $isWhatsApp ? WaLog::class : SmsLog::class;
        $logClass::create([
            'title'       => $eventName,
            'message'     => $message,
            'send_through' => $activeSetting->provider,
            'recipients'  => implode(',', $phones),
            'status'      => $failCount > 0 ? 'partial' : 'sent',
        ]);

        Log::info("NotificationDispatcher " . ($isWhatsApp ? 'WhatsApp' : 'SMS') . ": {$eventName} sent={$successCount} failed={$failCount}");
    }

    private static function resolveUserIds(array $roles, array $context): array
    {
        $ids = [];

        if (in_array('Student', $roles) && !empty($context['student_id'])) {
            $ids[] = (int) $context['student_id'];
        }

        if (in_array('Guardian', $roles) && !empty($context['guardian_id'])) {
            $ids[] = (int) $context['guardian_id'];
        }

        if (in_array('Staff', $roles) && !empty($context['staff_id'])) {
            $ids[] = (int) $context['staff_id'];
        }

        if (!empty($context['user_id'])) {
            $ids[] = (int) $context['user_id'];
        }

        return array_unique(array_filter($ids));
    }

    private static function resolveEmails(array $roles, array $context): array
    {
        $emails = [];

        if (in_array('Student', $roles) && !empty($context['student_id'])) {
            $user = User::find($context['student_id']);
            if ($user && $user->email) $emails[] = $user->email;
        }

        if (in_array('Guardian', $roles) && !empty($context['guardian_id'])) {
            $user = User::find($context['guardian_id']);
            if ($user) {
                if ($user->guardian_email) $emails[] = $user->guardian_email;
                if ($user->email) $emails[] = $user->email;
            }
        }

        if (in_array('Staff', $roles) && !empty($context['staff_id'])) {
            $user = User::find($context['staff_id']);
            if ($user && $user->email) $emails[] = $user->email;
        }

        if (!empty($context['email'])) {
            $emails[] = $context['email'];
        }

        return array_unique(array_filter($emails));
    }

    private static function resolvePhones(array $roles, array $context): array
    {
        $phones = [];

        if (in_array('Student', $roles) && !empty($context['student_id'])) {
            $user = User::find($context['student_id']);
            if ($user && $user->phone) $phones[] = $user->phone;
        }

        if (in_array('Guardian', $roles) && !empty($context['guardian_id'])) {
            $user = User::find($context['guardian_id']);
            if ($user) {
                if ($user->guardian_phone) $phones[] = $user->guardian_phone;
                if ($user->phone) $phones[] = $user->phone;
            }
        }

        if (in_array('Staff', $roles) && !empty($context['staff_id'])) {
            $user = User::find($context['staff_id']);
            if ($user && $user->phone) $phones[] = $user->phone;
        }

        if (!empty($context['phone'])) {
            $phones[] = $context['phone'];
        }

        return array_unique(array_filter($phones));
    }
}
