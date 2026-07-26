<?php

namespace App\Services;

use App\Models\OnlineAdmission;
use App\Models\GeneralSetting;
use App\Mail\AdmissionSubmitted;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class OnlineAdmissionNotification
{
    protected $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    /**
     * Send notifications for admission submission.
     */
    public function notifySubmission(OnlineAdmission $admission)
    {
        $settings = GeneralSetting::first();
        $adminEmail = $settings->email ?? config('mail.from.address');
        $adminPhone = $settings->phone ?? '';

        // 1. Notify Parent (Email)
        if ($admission->email) {
            try {
                Mail::to($admission->email)->send(new AdmissionSubmitted($admission, 'parent'));
            } catch (\Exception $e) {
                Log::error("Failed to send parent email: " . $e->getMessage());
            }
        }

        // 2. Notify Parent (WhatsApp)
        if ($admission->phone) {
            $message = "Hello {$admission->first_name}, your admission application ({$admission->reference_no}) has been submitted successfully. Please track it at iSchool.";
            $this->whatsAppService->sendMessage($admission->phone, $message);
        }

        // 3. Notify Admin (Email)
        if ($adminEmail) {
            try {
                Mail::to($adminEmail)->send(new AdmissionSubmitted($admission, 'admin'));
            } catch (\Exception $e) {
                Log::error("Failed to send admin email: " . $e->getMessage());
            }
        }

        // 4. Notify Admin (WhatsApp)
        if ($adminPhone) {
            $message = "New Admission Received: {$admission->first_name} {$admission->last_name} for Class {$admission->schoolClass->name}. Ref: {$admission->reference_no}";
            $this->whatsAppService->sendMessage($adminPhone, $message);
        }
    }

    /**
     * Send notifications for payment success.
     */
    public function notifyPaymentSuccess(OnlineAdmission $admission)
    {
        $message = "Payment received! Your admission application {$admission->reference_no} is now marked as Paid. Amount: {$admission->paid_amount}";
        
        // Notify Parent (WhatsApp)
        if ($admission->phone) {
            $this->whatsAppService->sendMessage($admission->phone, $message);
        }
        
        // Additional notification logic can be added here
    }
}
