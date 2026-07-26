<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send WhatsApp message.
     *
     * @param string $phone
     * @param string $message
     * @param string|null $templateId
     * @return bool
     */
    public function sendMessage(string $phone, string $message, string $templateId = null): bool
    {
        // Format phone number (ensure it has country code if needed)
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        Log::info("WhatsApp Message would be sent to {$phone}: {$message}");

        // Placeholder for BipSMS or other provider integration
        /*
        try {
            $response = Http::post('https://api.bipsms.com/whatsapp/send', [
                'api_key' => config('services.bipsms.key'),
                'phone' => $phone,
                'message' => $message,
                'template_id' => $templateId
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("WhatsApp send failed: " . $e->getMessage());
            return false;
        }
        */

        return true; // Mock success
    }
}
