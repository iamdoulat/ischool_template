<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\SmsSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $settings = SmsSetting::all();
        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Store or update SMS settings for a specific provider.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => 'required|string',
            'config' => 'required|array',
            'status' => 'required|boolean',
        ]);

        $setting = SmsSetting::updateOrCreate(
            ['provider' => $request->provider],
            [
                'config' => $request->config,
                'status' => $request->status,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'SMS Settings updated successfully',
            'data' => $setting
        ]);
    }

    /**
     * Test SMS gateway by sending a test message.
     */
    public function testSms(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => 'required|string',
            'phone' => 'required|string',
        ]);

        $setting = SmsSetting::where('provider', $request->provider)->first();

        if (!$setting || !$setting->status) {
            return response()->json([
                'status' => 'error',
                'message' => 'SMS gateway is not configured or disabled',
            ], 422);
        }

        $config = $setting->config;
        $phone = $request->phone;
        $message = 'This is a test SMS from ' . config('app.name', 'iSchool') . '. Your SMS gateway is configured correctly.';

        try {
            $sent = $this->sendViaGateway($request->provider, $config, $phone, $message);

            if ($sent) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Test SMS sent successfully',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send test SMS. Check gateway configuration.',
            ], 500);
        } catch (\Exception $e) {
            Log::error("SMS test failed for {$request->provider}: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'SMS test failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send SMS via the configured gateway provider.
     */
    public function sendViaGateway(string $provider, array $config, string $phone, string $message): bool
    {
        switch ($provider) {
            case 'twilio':
                $sid = $config['account_sid'] ?? '';
                $token = $config['auth_token'] ?? '';
                $from = $config['sender_phone'] ?? '';
                if (!$sid || !$token || !$from) return false;
                $response = Http::withBasicAuth($sid, $token)
                    ->asForm()
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                        'From' => $from,
                        'To' => $phone,
                        'Body' => $message,
                    ]);
                return $response->successful();

            case 'msg91':
                $authKey = $config['auth_key'] ?? '';
                $senderId = $config['sender_id'] ?? '';
                if (!$authKey || !$senderId) return false;
                $response = Http::withHeaders([
                    'authkey' => $authKey,
                ])->post('https://api.msg91.com/api/v5/flow/', [
                    'sender' => $senderId,
                    'mobiles' => $phone,
                    'message' => $message,
                ]);
                return $response->successful();

            case 'text_local':
                $apiKey = $config['api_key'] ?? '';
                $senderId = $config['sender_id'] ?? '';
                if (!$apiKey) return false;
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                ])->asForm()->post('https://api.textlocal.in/send/', [
                    'sender' => $senderId ?: 'TXTLCL',
                    'message' => $message,
                    'numbers' => $phone,
                ]);
                return $response->successful();

            case 'nexmo':
                $apiKey = $config['api_key'] ?? '';
                $apiSecret = $config['api_secret'] ?? '';
                $from = $config['sender_phone'] ?? config('app.name');
                if (!$apiKey || !$apiSecret) return false;
                $response = Http::post('https://rest.nexmo.com/sms/json', [
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                    'from' => $from,
                    'to' => $phone,
                    'text' => $message,
                ]);
                return $response->successful();

            case 'africas_talking':
                $username = $config['username'] ?? '';
                $apiKey = $config['api_key'] ?? '';
                if (!$username || !$apiKey) return false;
                $response = Http::withHeaders([
                    'apiKey' => $apiKey,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ])->asForm()->post('https://api.africastalking.com/version1/messaging', [
                    'username' => $username,
                    'to' => $phone,
                    'message' => $message,
                ]);
                return $response->successful();

            case 'clickatell':
                $apiKey = $config['api_key'] ?? '';
                if (!$apiKey) return false;
                $response = Http::withHeaders([
                    'Authorization' => $apiKey,
                    'Content-Type' => 'application/json',
                ])->post('https://platform.clickatell.com/messages', [
                    'to' => [$phone],
                    'content' => $message,
                ]);
                return $response->successful();

            case 'sms_country':
                $username = $config['username'] ?? '';
                $password = $config['password'] ?? '';
                $senderId = $config['sender_id'] ?? '';
                if (!$username || !$password) return false;
                $response = Http::get('https://api.smscountry.com/SMSCwebservice/bulksms', [
                    'User' => $username,
                    'passwd' => $password,
                    'sid' => $senderId ?: 'SMSCTRY',
                    'mobilenumber' => $phone,
                    'message' => $message,
                ]);
                return $response->successful();

            case 'bulk_sms':
                $username = $config['username'] ?? '';
                $password = $config['password'] ?? '';
                if (!$username || !$password) return false;
                $response = Http::withBasicAuth($username, $password)
                    ->post('https://api.bulksms.com/v1/messages', [
                        'to' => $phone,
                        'body' => $message,
                    ]);
                return $response->successful();

            case 'mobi_reach':
                $authKey = $config['auth_key'] ?? '';
                $routeId = $config['route_id'] ?? '';
                if (!$authKey) return false;
                $response = Http::withHeaders([
                    'Auth-Key' => $authKey,
                ])->post('https://api.mobireach.com.bd/api/v1/send-sms', [
                    'route_id' => $routeId,
                    'mobile' => $phone,
                    'message' => $message,
                ]);
                return $response->successful();

            case 'sms_egypt':
                $username = $config['username'] ?? '';
                $password = $config['password'] ?? '';
                $senderId = $config['sender_id'] ?? '';
                if (!$username || !$password) return false;
                $response = Http::post('https://www.smsegypt.com/api/v1/send', [
                    'username' => $username,
                    'password' => $password,
                    'sender' => $senderId,
                    'mobile' => $phone,
                    'message' => $message,
                ]);
                return $response->successful();

            case 'sms_gateway_hub':
                $apiKey = $config['api_key'] ?? '';
                $senderId = $config['sender_id'] ?? '';
                if (!$apiKey) return false;
                $response = Http::withHeaders([
                    'x-api-key' => $apiKey,
                ])->post('https://api.smsgatewayhub.com/v1/send', [
                    'sender_id' => $senderId,
                    'to' => $phone,
                    'message' => $message,
                ]);
                return $response->successful();

            case 'bipsms':
                $secret = $config['secret'] ?? '';
                $mode = $config['mode'] ?? 'devices';
                if (!$secret) return false;
                $payload = [
                    'secret' => $secret,
                    'mode' => $mode,
                    'phone' => $phone,
                    'message' => $message,
                ];
                if (!empty($config['device'])) $payload['device'] = $config['device'];
                if (!empty($config['gateway'])) $payload['gateway'] = $config['gateway'];
                if (!empty($config['sim'])) $payload['sim'] = (int) $config['sim'];
                if (!empty($config['priority'])) $payload['priority'] = (int) $config['priority'];
                $response = Http::asMultipart()->post('https://app.bipsms.com/api/send/sms', $payload);
                $responseData = $response->json();
                if (is_array($responseData) && isset($responseData['status']) && $responseData['status'] == 200) {
                    return true;
                }
                $errorMsg = is_array($responseData) && isset($responseData['message']) 
                    ? $responseData['message'] 
                    : ($response->body() ?: 'BipSMS API request failed');
                throw new \Exception($errorMsg);

            case 'whatsapp_meta':
                $accessToken = $config['access_token'] ?? '';
                $phoneNumberId = $config['phone_number_id'] ?? '';
                $language = $config['language'] ?? 'en';
                if (!$accessToken || !$phoneNumberId) return false;
                $response = Http::withToken($accessToken)
                    ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", [
                        'messaging_product' => 'whatsapp',
                        'to' => $phone,
                        'type' => 'template',
                        'template' => [
                            'name' => 'hello_world',
                            'language' => [
                                'code' => $language,
                            ],
                        ],
                    ]);
                if (!$response->successful()) {
                    $errorMsg = $response->json('error.message', 'WhatsApp API request failed');
                    throw new \Exception($errorMsg);
                }
                return true;

            case 'whatsapp_twilio':
                $sid = $config['account_sid'] ?? '';
                $token = $config['auth_token'] ?? '';
                $from = $config['sender_phone'] ?? '';
                if (!$sid || !$token || !$from) return false;
                $response = Http::withBasicAuth($sid, $token)
                    ->asForm()
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                        'From' => 'whatsapp:' . $from,
                        'To' => 'whatsapp:' . $phone,
                        'Body' => $message,
                    ]);
                if (!$response->successful()) {
                    $errorMsg = $response->json('message', 'Twilio WhatsApp API request failed');
                    throw new \Exception($errorMsg);
                }
                return true;

            case 'whatsapp_bipsms':
                $secret = $config['secret'] ?? '';
                $account = $config['account'] ?? '';
                $priority = $config['priority'] ?? 2;
                if (!$secret || !$account) return false;
                $payload = [
                    'secret' => $secret,
                    'account' => $account,
                    'recipient' => $phone,
                    'type' => 'text',
                    'message' => $message,
                    'priority' => (int) $priority,
                ];
                $response = Http::asMultipart()->post('https://app.bipsms.com/api/send/whatsapp', $payload);
                $responseData = $response->json();
                if (is_array($responseData) && isset($responseData['status']) && $responseData['status'] == 200) {
                    return true;
                }
                $errorMsg = is_array($responseData) && isset($responseData['message']) 
                    ? $responseData['message'] 
                    : ($response->body() ?: 'BipSMS WhatsApp API request failed');
                throw new \Exception($errorMsg);

            case 'custom':
                $url = $config['url'] ?? '';
                $method = strtoupper($config['method'] ?? 'POST');
                $name = $config['name'] ?? '';
                if (!$url) return false;
                $payload = array_merge($config, [
                    'to' => $phone,
                    'message' => $message,
                ]);
                unset($payload['url'], $payload['method'], $payload['name']);
                $response = $method === 'GET'
                    ? Http::get($url, $payload)
                    : Http::post($url, $payload);
                return $response->successful();

            default:
                Log::warning("Unknown SMS provider: {$provider}");
                return false;
        }
    }
}
