<?php

namespace App\Http\Controllers\Api\v1\Communicate;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\SmsLog;
use App\Models\EmailLog;
use App\Models\GeneralSetting;
use App\Mail\SendEmailMail;
use App\Mail\LoginCredentialMail;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CommunicateController extends BaseController
{
    /**
     * Search students for login credentials distribution.
     */
    public function searchStudents(Request $request)
    {
        $request->validate([
            'class_id' => 'required',
            'section_id' => 'required',
        ]);

        $query = User::role('Student')->with(['schoolClass', 'section'])
            ->where('school_class_id', $request->class_id)
            ->where('section_id', $request->section_id);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('last_name', 'like', '%' . $request->search . '%')
                  ->orWhere('admission_no', 'like', '%' . $request->search . '%');
            });
        }

        $students = $query->latest()->get();

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Send login credentials to selected students/parents.
     */
    public function sendCredentials(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'message_to' => 'required|in:student,parent',
            'notification_type' => 'required|in:email,sms,both',
        ]);

        $students = User::role('Student')->whereIn('id', $request->student_ids)->get();
        $schoolName = GeneralSetting::first()?->school_name ?? 'School';
        $count = 0;

        foreach ($students as $student) {
            $email = $request->message_to === 'parent'
                ? $student->guardian_email
                : $student->email;

            if (!$email) continue;

            $newPassword = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8);
            $student->password = Hash::make($newPassword);
            $student->save();

            if ($request->notification_type === 'email' || $request->notification_type === 'both') {
                Mail::to($email)->send(new LoginCredentialMail(
                    $student->name . ' ' . $student->last_name,
                    $student->username ?? $student->admission_no,
                    $student->admission_no,
                    $newPassword,
                    $schoolName,
                ));
            }

            NotificationDispatcher::dispatch('Student Login Credential', [
                'display_name' => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'url' => config('app.url'),
                'username' => $student->username ?? $student->admission_no ?? '',
                'password' => $newPassword,
                'admission_no' => $student->admission_no ?? '',
            ], [
                'student_id' => $student->id,
                'email' => $email,
            ]);

            Log::info("Credentials sent to {$request->message_to} {$email} for student: {$student->name} ({$student->admission_no})");
            $count++;
        }

        return response()->json([
            'message' => "Credentials sent successfully to {$count} recipients.",
            'count' => $count
        ]);
    }

    /**
     * Send bulk SMS to selected roles or groups.
     */
    private function formatMessage(string $message, $user = null): string
    {
        if (!$user) {
            return preg_replace('/\{[a-z_]+\}/', '', $message);
        }

        $replacements = [
            '{name}' => trim(($user->name ?? '') . ' ' . ($user->last_name ?? '')),
            '{first_name}' => $user->name ?? '',
            '{last_name}' => $user->last_name ?? '',
            '{email}' => $user->email ?? '',
            '{phone}' => $user->phone ?? '',
            '{admission_no}' => $user->admission_no ?? '',
            '{roll_no}' => $user->roll_no ?? '',
            '{father_name}' => $user->father_name ?? '',
            '{mother_name}' => $user->mother_name ?? '',
            '{guardian_name}' => $user->guardian_name ?? '',
            // Additional variables based on frontend variable-picker mapping can be added here
            '{school_name}' => \App\Models\GeneralSetting::first()->school_name ?? '',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    public function sendSMS(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'send_through' => 'required|array',
            'recipients' => 'required|array',
            'send_type' => 'required|in:now,schedule',
            'scheduled_at' => 'required_if:send_type,schedule|nullable|date',
        ]);

        $log = SmsLog::create([
            'title' => $request->title,
            'message' => $request->message,
            'send_through' => implode(',', $request->send_through),
            'recipients' => implode(',', $request->recipients),
            'status' => $request->send_type === 'now' ? 'sent' : 'scheduled',
            'scheduled_at' => $request->send_type === 'schedule' ? Carbon::parse($request->scheduled_at) : null,
        ]);

        $phones = $this->resolvePhones($request->recipients);

        if ($request->send_type === 'now' && !empty($phones)) {
            $activeSmsSetting = \App\Models\SmsSetting::where('provider', 'not like', 'whatsapp_%')->where('status', true)->first();

            if (!$activeSmsSetting) {
                return response()->json([
                    'message' => 'SMS gateway is not configured or disabled.',
                ], 422);
            }
            
            $smsController = new \App\Http\Controllers\Api\v1\SystemSetting\SmsSettingController();
            $successCount = 0;
            $failCount = 0;

            foreach ($phones as $phone => $user) {
                try {
                    $personalizedMessage = $this->formatMessage($request->message, $user);
                    $sent = $smsController->sendViaGateway($activeSmsSetting->provider, $activeSmsSetting->config, $phone, $personalizedMessage);
                    if ($sent) {
                        $successCount++;
                    } else {
                        $failCount++;
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send SMS to {$phone}: " . $e->getMessage());
                    $failCount++;
                }
            }
            
            Log::info("SMS Dispatch Triggered: {$request->title} to " . implode(',', array_keys($phones)) . ". Success: {$successCount}, Failed: {$failCount}");

            return response()->json([
                'message' => "SMS sent. Success: {$successCount}, Failed: {$failCount}",
                'data' => $log
            ]);
        }

        Log::info("SMS Dispatch Scheduled: {$request->title} to " . implode(',', $request->recipients));

        return response()->json([
            'message' => 'SMS scheduled successfully',
            'data' => $log
        ]);
    }

    /**
     * Send bulk WhatsApp messages to selected roles or groups.
     */
    public function sendWA(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'send_through' => 'required|array',
            'recipients' => 'required|array',
            'send_type' => 'required|in:now,schedule',
            'scheduled_at' => 'required_if:send_type,schedule|nullable|date',
        ]);

        $log = \App\Models\WaLog::create([
            'title' => $request->title,
            'message' => $request->message,
            'send_through' => implode(',', $request->send_through),
            'recipients' => implode(',', $request->recipients),
            'status' => $request->send_type === 'now' ? 'sent' : 'scheduled',
            'scheduled_at' => $request->send_type === 'schedule' ? \Carbon\Carbon::parse($request->scheduled_at) : null,
        ]);

        $phones = $this->resolvePhones($request->recipients);

        if ($request->send_type === 'now' && !empty($phones)) {
            $activeWaSetting = \App\Models\SmsSetting::where('provider', 'like', 'whatsapp_%')->where('status', true)->first();

            if (!$activeWaSetting) {
                return response()->json([
                    'message' => 'WhatsApp gateway is not configured or disabled.',
                ], 422);
            }
            
            $smsController = new \App\Http\Controllers\Api\v1\SystemSetting\SmsSettingController();
            $successCount = 0;
            $failCount = 0;

            foreach ($phones as $phone => $user) {
                try {
                    $personalizedMessage = $this->formatMessage($request->message, $user);
                    $sent = $smsController->sendViaGateway($activeWaSetting->provider, $activeWaSetting->config, $phone, $personalizedMessage);
                    if ($sent) {
                        $successCount++;
                    } else {
                        $failCount++;
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send WA message to {$phone}: " . $e->getMessage());
                    $failCount++;
                }
            }
            
            Log::info("WhatsApp Dispatch Triggered: {$request->title} to " . implode(',', array_keys($phones)) . ". Success: {$successCount}, Failed: {$failCount}");

            return response()->json([
                'message' => "WhatsApp message sent. Success: {$successCount}, Failed: {$failCount}",
                'data' => $log
            ]);
        }

        Log::info("WhatsApp Dispatch Scheduled: {$request->title} to " . implode(',', $request->recipients));

        return response()->json([
            'message' => 'WhatsApp message scheduled successfully',
            'data' => $log
        ]);
    }

    /**
     * Send bulk Email to selected roles or groups.
     */
    public function sendEmail(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipients' => 'required|array',
            'send_type' => 'required|in:now,schedule',
            'scheduled_at' => 'required_if:send_type,schedule|nullable|date',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,gif,docx,pptx,xlsx|max:5120',
        ]);

        $attachmentPath = null;
        $originalFilename = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('communicate/attachments');
            $originalFilename = $request->file('attachment')->getClientOriginalName();
        }

        $log = EmailLog::create([
            'title' => $request->title,
            'message' => $request->message,
            'attachment' => $attachmentPath,
            'original_filename' => $originalFilename,
            'recipients' => implode(',', $request->recipients),
            'status' => $request->send_type === 'now' ? 'sent' : 'scheduled',
            'scheduled_at' => $request->send_type === 'schedule' ? Carbon::parse($request->scheduled_at) : null,
        ]);

        // Resolve email addresses from recipient identifiers
        $emailRecipients = $this->resolveRecipients($request->recipients);

        if ($request->send_type === 'now' && !empty($emailRecipients)) {
            foreach ($emailRecipients as $email => $user) {
                try {
                    $personalizedTitle = $this->formatMessage($request->title, $user);
                    $personalizedMessage = $this->formatMessage($request->message, $user);
                    Mail::to($email)->send(new SendEmailMail($personalizedTitle, $personalizedMessage, $attachmentPath));
                } catch (\Exception $e) {
                    Log::error("Failed to send email to {$email}: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => $request->send_type === 'now' ? 'Email sent successfully' : 'Email scheduled successfully',
            'data' => $log
        ]);
    }

    /**
     * Resolve recipient identifiers (roles, user IDs, class IDs) to actual email addresses.
     */
    private function resolveRecipients(array $recipients): array
    {
        $emails = [];

        foreach ($recipients as $r) {
            // Role-based: e.g. "role:Student"
            if (str_starts_with($r, 'role:')) {
                $role = substr($r, 5);
                $users = User::role($role)->get();
                foreach ($users as $u) {
                    if ($u->email) $emails[$u->email] = $u;
                    if ($role === 'Student' && $u->guardian_email) $emails[$u->guardian_email] = $u;
                    if ($role === 'Parent' && $u->guardian_email) $emails[$u->guardian_email] = $u;
                }
            }
            // User ID: e.g. "user:5"
            elseif (str_starts_with($r, 'user:')) {
                $id = (int) substr($r, 5);
                $user = User::find($id);
                if ($user && $user->email) $emails[$user->email] = $user;
            }
            // Class: e.g. "class:3" → all students in that class
            elseif (str_starts_with($r, 'class:')) {
                $classId = (int) substr($r, 6);
                $students = User::role('Student')->where('school_class_id', $classId)->get();
                foreach ($students as $s) {
                    if ($s->email) $emails[$s->email] = $s;
                    if ($s->guardian_email) $emails[$s->guardian_email] = $s;
                }
            }
            // Birthday: resolve all users with birthday today
            elseif ($r === 'birthday') {
                $today = Carbon::today();
                $users = User::whereRaw('MONTH(dob) = ? AND DAY(dob) = ?', [$today->month, $today->day])->get();
                foreach ($users as $u) {
                    if ($u->email) $emails[$u->email] = $u;
                }
            }
            // Direct email string
            elseif (str_contains($r, '@')) {
                if (!isset($emails[$r])) {
                    $emails[$r] = null;
                }
            }
        }

        return $emails;
    }

    /**
     * Resolve recipient identifiers (roles, user IDs, class IDs) to actual phone numbers.
     */
    private function resolvePhones(array $recipients): array
    {
        $phones = [];

        foreach ($recipients as $r) {
            // Role-based: e.g. "role:Student"
            if (str_starts_with($r, 'role:')) {
                $role = substr($r, 5);
                $users = User::role($role)->get();
                foreach ($users as $u) {
                    if ($u->phone) $phones[$u->phone] = $u;
                    if ($role === 'Student' && $u->guardian_phone) $phones[$u->guardian_phone] = $u;
                    if ($role === 'Parent' && $u->guardian_phone) $phones[$u->guardian_phone] = $u;
                }
            }
            // User ID: e.g. "user:5"
            elseif (str_starts_with($r, 'user:')) {
                $id = (int) substr($r, 5);
                $user = User::find($id);
                if ($user && $user->phone) $phones[$user->phone] = $user;
            }
            // Class: e.g. "class:3"
            elseif (str_starts_with($r, 'class:')) {
                $classId = (int) substr($r, 6);
                $students = User::role('Student')->where('school_class_id', $classId)->get();
                foreach ($students as $s) {
                    if ($s->phone) $phones[$s->phone] = $s;
                    if ($s->guardian_phone) $phones[$s->guardian_phone] = $s;
                }
            }
            // Birthday: resolve all users with birthday today
            elseif ($r === 'birthday') {
                $today = Carbon::today();
                $users = User::whereRaw('MONTH(dob) = ? AND DAY(dob) = ?', [$today->month, $today->day])->get();
                foreach ($users as $u) {
                    if ($u->phone) $phones[$u->phone] = $u;
                }
            }
            elseif (preg_match('/^\+?[0-9\s\-()]+$/', $r)) {
                $num = preg_replace('/[^0-9+]/', '', $r);
                if (!isset($phones[$num])) {
                    $phones[$num] = null;
                }
            }
        }

        return $phones;
    }

    /**
     * Resolve recipient identifiers to human-readable labels.
     */
    private function resolveRecipientLabels(array $recipients): array
    {
        $labels = [];
        foreach ($recipients as $r) {
            if (str_starts_with($r, 'role:')) {
                $role = substr($r, 5);
                $labels[] = "All {$role}s";
            } elseif (str_starts_with($r, 'user:')) {
                $id = (int) substr($r, 5);
                $user = User::find($id);
                $labels[] = $user ? trim($user->name . ' ' . ($user->last_name ?? '')) : "User #{$id}";
            } elseif (str_starts_with($r, 'class:')) {
                $classId = (int) substr($r, 6);
                $class = \App\Models\SchoolClass::find($classId);
                $labels[] = $class ? "Class: {$class->name}" : "Class #{$classId}";
            } elseif ($r === 'birthday') {
                $labels[] = "Today's Birthdays";
            } elseif (str_contains($r, '@')) {
                $labels[] = $r;
            } else {
                $labels[] = $r;
            }
        }
        return $labels;
    }

    /**
     * Get users by role for Individual tab.
     */
    public function usersByRole($role)
    {
        $users = User::role($role)->select('id', 'name', 'last_name', 'email', 'phone')->get();
        return $this->success($users, 'Users retrieved successfully');
    }

    /**
     * Get all classes for Class tab.
     */
    public function getClasses()
    {
        $classes = SchoolClass::with('sections')->get();
        return $this->success($classes, 'Classes retrieved successfully');
    }

    /**
     * Get users with birthday today for Birthday tab.
     */
    public function birthdayUsers(Request $request)
    {
        $today = Carbon::today();
        $query = User::whereRaw('MONTH(dob) = ? AND DAY(dob) = ?', [$today->month, $today->day])
            ->select('id', 'name', 'last_name', 'email', 'dob', 'role', 'school_class_id');

        if ($request->class_id) {
            $query->where('school_class_id', $request->class_id);
        }

        $users = $query->get();
        return $this->success($users, 'Birthday users retrieved successfully');
    }

    /**
     * Get students by class ID for Class tab.
     */
    public function studentsByClass($classId)
    {
        $students = User::role('Student')->where('school_class_id', $classId)
            ->select('id', 'name', 'last_name', 'email', 'roll_no', 'admission_no')
            ->get();
        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Get unified list of SMS, WA, and Email logs.
     */
    public function scheduledLogs(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 20), 500);

        try {
            $smsLogs = SmsLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                ->selectRaw('true as is_sms, false as is_email, false as is_wa, NULL as attachment')
                ->whereNotNull('scheduled_at')
                ->get();

            $waLogs = \App\Models\WaLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                ->selectRaw('false as is_sms, false as is_email, true as is_wa, NULL as attachment')
                ->whereNotNull('scheduled_at')
                ->get();

            $emailLogs = EmailLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients', 'attachment', 'original_filename')
                ->selectRaw('false as is_sms, true as is_email, false as is_wa')
                ->whereNotNull('scheduled_at')
                ->get();
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'Unknown column')) {
                \Illuminate\Support\Facades\DB::statement('ALTER TABLE email_logs ADD original_filename VARCHAR(255) NULL AFTER attachment');
                $smsLogs = SmsLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                    ->selectRaw('true as is_sms, false as is_email, false as is_wa, NULL as attachment')
                    ->whereNotNull('scheduled_at')
                    ->get();

                $waLogs = \App\Models\WaLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                    ->selectRaw('false as is_sms, false as is_email, true as is_wa, NULL as attachment')
                    ->whereNotNull('scheduled_at')
                    ->get();

                $emailLogs = EmailLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients', 'attachment', 'original_filename')
                    ->selectRaw('false as is_sms, true as is_email, false as is_wa')
                    ->whereNotNull('scheduled_at')
                    ->get();
            } else {
                throw $e;
            }
        }

        $allLogs = $smsLogs->concat($waLogs)->concat($emailLogs)->sortByDesc('created_at')->values();

        $total = $allLogs->count();
        $currentPage = max((int) $request->input('page', 1), 1);
        $lastPage = max((int) ceil($total / $perPage), 1);
        $offset = ($currentPage - 1) * $perPage;
        $pageItems = $allLogs->slice($offset, $perPage)->values();

        $mappedLogs = $pageItems->map(function ($log) {
            $rawRecipients = $log->recipients ? explode(',', $log->recipients) : [];
            $resolvedRecipients = $this->resolveRecipientLabels($rawRecipients);
            $typePrefix = $log->is_email ? 'email_' : ($log->is_wa ? 'wa_' : 'sms_');
            return [
                'id' => $typePrefix . $log->id,
                'title' => $log->title,
                'message' => $log->message,
                'date' => Carbon::parse($log->created_at)->format('m/d/Y h:i a'),
                'scheduleDate' => $log->scheduled_at ? Carbon::parse($log->scheduled_at)->format('m/d/Y h:i a') : '-',
                'isEmail' => (bool) $log->is_email,
                'isSms' => (bool) $log->is_sms,
                'isWa' => (bool) $log->is_wa,
                'hasAttachment' => !empty($log->attachment),
                'attachment' => $log->attachment ?? null,
                'original_filename' => $log->original_filename ?? null,
                'recipients' => $resolvedRecipients,
                'isGroup' => true,
                'isIndividual' => false,
                'isClass' => false,
            ];
        });

        return response()->json([
            'data' => $mappedLogs,
            'current_page' => $currentPage,
            'last_page' => $lastPage,
            'total' => $total,
            'per_page' => $perPage,
        ]);
    }

    /**
     * Get unified list of ALL SMS, WA, and Email logs.
     */
    public function logs(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 20), 500);

        try {
            $smsLogs = SmsLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                ->selectRaw('true as is_sms, false as is_email, false as is_wa, NULL as attachment')
                ->get();

            $waLogs = \App\Models\WaLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                ->selectRaw('false as is_sms, false as is_email, true as is_wa, NULL as attachment')
                ->get();

            $emailLogs = EmailLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients', 'attachment', 'original_filename')
                ->selectRaw('false as is_sms, true as is_email, false as is_wa')
                ->get();
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'Unknown column')) {
                \Illuminate\Support\Facades\DB::statement('ALTER TABLE email_logs ADD original_filename VARCHAR(255) NULL AFTER attachment');
                $smsLogs = SmsLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                    ->selectRaw('true as is_sms, false as is_email, false as is_wa, NULL as attachment')
                    ->get();

                $waLogs = \App\Models\WaLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients')
                    ->selectRaw('false as is_sms, false as is_email, true as is_wa, NULL as attachment')
                    ->get();

                $emailLogs = EmailLog::select('id', 'title', 'message', 'created_at', 'scheduled_at', 'recipients', 'attachment', 'original_filename')
                    ->selectRaw('false as is_sms, true as is_email, false as is_wa')
                    ->get();
            } else {
                throw $e;
            }
        }

        $allLogs = $smsLogs->concat($waLogs)->concat($emailLogs)->sortByDesc('created_at')->values();

        $total = $allLogs->count();
        $currentPage = max((int) $request->input('page', 1), 1);
        $lastPage = max((int) ceil($total / $perPage), 1);
        $offset = ($currentPage - 1) * $perPage;
        $pageItems = $allLogs->slice($offset, $perPage)->values();

        $mappedLogs = $pageItems->map(function ($log) {
            $rawRecipients = $log->recipients ? explode(',', $log->recipients) : [];
            $resolvedRecipients = $this->resolveRecipientLabels($rawRecipients);
            $typePrefix = $log->is_email ? 'email_' : ($log->is_wa ? 'wa_' : 'sms_');
            return [
                'id' => $typePrefix . $log->id,
                'title' => $log->title,
                'message' => $log->message,
                'date' => Carbon::parse($log->created_at)->format('m/d/Y h:i a'),
                'scheduleDate' => $log->scheduled_at ? Carbon::parse($log->scheduled_at)->format('m/d/Y h:i a') : '-',
                'isEmail' => (bool) $log->is_email,
                'isSms' => (bool) $log->is_sms,
                'isWa' => (bool) $log->is_wa,
                'hasAttachment' => !empty($log->attachment),
                'attachment' => $log->attachment ?? null,
                'original_filename' => $log->original_filename ?? null,
                'recipients' => $resolvedRecipients,
                'isGroup' => true,
                'isIndividual' => false,
                'isClass' => false,
            ];
        });

        return response()->json([
            'data' => $mappedLogs,
            'current_page' => $currentPage,
            'last_page' => $lastPage,
            'total' => $total,
            'per_page' => $perPage,
        ]);
    }

    public function deleteLog(Request $request)
    {
        $ids = $request->input('ids', []);
        $type = $request->input('type');
        $routeId = $request->route('id');

        // Single delete (DELETE route with {id})
        if ($routeId && empty($ids)) {
            $numericId = (int) preg_replace('/[^0-9]/', '', $routeId);
            $type = $type ?: (str_contains($routeId, 'email_') ? 'email' : (str_contains($routeId, 'wa_') ? 'wa' : 'sms'));
            if ($type === 'email') {
                $log = EmailLog::find($numericId);
                if ($log && $log->attachment && \Illuminate\Support\Facades\Storage::exists($log->attachment)) {
                    \Illuminate\Support\Facades\Storage::delete($log->attachment);
                }
                EmailLog::where('id', $numericId)->delete();
            } elseif ($type === 'wa') {
                \App\Models\WaLog::where('id', $numericId)->delete();
            } else {
                SmsLog::where('id', $numericId)->delete();
            }
            return $this->success(null, 'Log deleted successfully');
        }

        // Delete all
        if ($type === 'all') {
            $emailLogs = EmailLog::whereNotNull('attachment')->get();
            foreach ($emailLogs as $log) {
                if ($log->attachment && \Illuminate\Support\Facades\Storage::exists($log->attachment)) {
                    \Illuminate\Support\Facades\Storage::delete($log->attachment);
                }
            }
            EmailLog::truncate();
            SmsLog::truncate();
            \App\Models\WaLog::truncate();
            return $this->success(null, 'All logs deleted successfully');
        }

        // Bulk delete
        if (!empty($ids) && in_array($type, ['email', 'sms', 'wa'])) {
            if ($type === 'email') {
                $logs = EmailLog::whereIn('id', $ids)->whereNotNull('attachment')->get();
                foreach ($logs as $log) {
                    if (\Illuminate\Support\Facades\Storage::exists($log->attachment)) {
                        \Illuminate\Support\Facades\Storage::delete($log->attachment);
                    }
                }
                EmailLog::whereIn('id', $ids)->delete();
            } elseif ($type === 'wa') {
                \App\Models\WaLog::whereIn('id', $ids)->delete();
            } else {
                SmsLog::whereIn('id', $ids)->delete();
            }
            return $this->success(null, 'Log(s) deleted successfully');
        }

        return $this->error('Invalid request');
    }

    public function downloadAttachment($id)
    {
        $log = EmailLog::find($id);
        if (!$log || !$log->attachment || !\Illuminate\Support\Facades\Storage::exists($log->attachment)) {
            return $this->error('Attachment not found');
        }
        $filename = $log->original_filename ?: basename($log->attachment);
        return response()->download(\Illuminate\Support\Facades\Storage::path($log->attachment), $filename);
    }

    /**
     * Send in-app system notification to targeted roles/users.
     */
    public function sendNotification(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipients' => 'nullable|array',
            'user_ids' => 'nullable|array',
            'class_id' => 'nullable|integer',
            'section_id' => 'nullable|integer',
        ]);

        $query = User::query();

        if (!empty($request->user_ids)) {
            $query->whereIn('id', $request->user_ids);
        } else if ($request->class_id) {
            $query->where('school_class_id', $request->class_id);
            if ($request->section_id) {
                $query->where('section_id', $request->section_id);
            }
        } else if (!empty($request->recipients) && !in_array('All', $request->recipients)) {
            $roles = $request->recipients;
            $query->where(function($q) use ($roles) {
                foreach ($roles as $role) {
                    if (strcasecmp($role, 'Staff') === 0) {
                        $q->orWhere(function($sq) {
                            $sq->whereNotIn('role', ['Student', 'Parent', 'Guardian'])
                               ->orWhereNull('role');
                        })->orWhereHas('roles', function($rq) {
                            $rq->whereNotIn('name', ['Student', 'Parent', 'Guardian']);
                        });
                    } else {
                        $q->orWhere('role', 'like', '%' . $role . '%')
                          ->orWhereHas('roles', function($rq) use ($role) {
                              $rq->where('name', 'like', '%' . $role . '%');
                          });
                    }
                }
            });
        }

        $users = $query->get();
        if ($users->isEmpty() && (empty($request->recipients) || in_array('All', $request->recipients))) {
            $users = User::all();
        }

        $notifications = [];
        foreach ($users as $u) {
            $notifications[] = [
                'user_id'    => $u->id,
                'title'      => $request->title,
                'body'       => $request->message,
                'type'       => 'Custom',
                'data'       => json_encode(['sent_by' => $request->user()->name ?? 'Admin']),
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($notifications)) {
            \App\Models\AppNotification::insert($notifications);
        }

        return $this->success([
            'count' => count($notifications),
        ], 'Notification sent successfully to ' . count($notifications) . ' user(s)');
    }
}
