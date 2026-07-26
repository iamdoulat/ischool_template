<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class EmailSettingController extends BaseController
{
    /**
     * Get current email settings from .env file.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Try to get encryption from both MAIL_ENCRYPTION and MAIL_SCHEME
        $encryption = env('MAIL_ENCRYPTION') ?? env('MAIL_SCHEME', 'tls');

        $settings = [
            'mail_mailer' => env('MAIL_MAILER', 'smtp'),
            'mail_host' => env('MAIL_HOST', ''),
            'mail_port' => env('MAIL_PORT', '587'),
            'mail_username' => env('MAIL_USERNAME', ''),
            'mail_password' => env('MAIL_PASSWORD', ''),
            'mail_encryption' => $encryption,
            'mail_from_address' => env('MAIL_FROM_ADDRESS', ''),
            'mail_from_name' => str_replace('"', '', env('MAIL_FROM_NAME', env('APP_NAME'))),
        ];

        return $this->success($settings, 'Email settings retrieved successfully');
    }

    /**
     * Update email settings in .env file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mail_mailer' => 'required|string|in:smtp,sendmail,phpmail,log',
            'mail_host' => 'required_if:mail_mailer,smtp|nullable|string',
            'mail_port' => 'required_if:mail_mailer,smtp|nullable|string',
            'mail_username' => 'required_if:mail_mailer,smtp|nullable|string',
            'mail_password' => 'required_if:mail_mailer,smtp|nullable|string',
            'mail_encryption' => 'required_if:mail_mailer,smtp|nullable|string|in:tls,ssl,none',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string',
        ]);

        try {
            // Update .env with both MAIL_ENCRYPTION and MAIL_SCHEME for compatibility
            $envData = [
                'MAIL_MAILER' => $validated['mail_mailer'],
                'MAIL_HOST' => $validated['mail_host'] ?? '',
                'MAIL_PORT' => $validated['mail_port'] ?? '',
                'MAIL_USERNAME' => $validated['mail_username'] ?? '',
                'MAIL_PASSWORD' => $validated['mail_password'] ?? '',
                'MAIL_ENCRYPTION' => $validated['mail_encryption'] ?? 'tls',
                'MAIL_SCHEME' => $validated['mail_encryption'] ?? 'tls', // Keep both for compatibility
                'MAIL_FROM_ADDRESS' => $validated['mail_from_address'],
                'MAIL_FROM_NAME' => '"' . $validated['mail_from_name'] . '"',
            ];

            $this->updateEnv($envData);

            // Clear config cache to apply changes
            Artisan::call('config:clear');

            return $this->success($validated, 'Email settings updated successfully and .env updated');
        } catch (\Exception $e) {
            return $this->error('Failed to update email settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send test email using current .env settings.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function testEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'test_email' => 'required|email',
        ]);

        try {
            // Clear config cache to use the latest settings
            Artisan::call('config:clear');

            // Reload mail configuration from .env
            $this->reloadMailConfig();

            $testEmail = $validated['test_email'];
            $fromName = str_replace('"', '', env('MAIL_FROM_NAME', config('app.name')));

            Mail::raw(
                "This is a test email from {$fromName}.\n\nIf you received this email, your email settings are configured correctly.\n\nSent at: " . now()->format('Y-m-d H:i:s'),
                function ($message) use ($testEmail, $fromName) {
                    $message->to($testEmail)
                        ->subject("Test Email from {$fromName}");
                }
            );

            return $this->success(['test_email' => $testEmail], 'Test email sent successfully to ' . $testEmail);
        } catch (\Exception $e) {
            return $this->error('Failed to send test email: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reload mail configuration from .env file.
     *
     * @return void
     */
    private function reloadMailConfig(): void
    {
        // Get encryption from either MAIL_ENCRYPTION or MAIL_SCHEME
        $encryption = env('MAIL_ENCRYPTION') ?? env('MAIL_SCHEME', 'tls');

        // Set encryption to null if 'none' is selected
        $encryptionValue = $encryption === 'none' ? null : $encryption;

        Config::set('mail.default', env('MAIL_MAILER', 'smtp'));
        Config::set('mail.mailers.smtp', [
            'transport' => 'smtp',
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'encryption' => $encryptionValue,
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url(env('APP_URL', 'localhost'), PHP_URL_HOST)),
        ]);

        Config::set('mail.from', [
            'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
            'name' => str_replace('"', '', env('MAIL_FROM_NAME', env('APP_NAME'))),
        ]);
    }

    /**
     * Update .env file with given data.
     *
     * @param array $data
     * @return void
     */
    private function updateEnv(array $data): void
    {
        $envFile = base_path('.env');
        $content = file_get_contents($envFile);

        foreach ($data as $key => $value) {
            // Escape special characters in the pattern
            $escapedKey = preg_quote($key, '/');
            $pattern = "/^{$escapedKey}=.*/m";
            $replacement = "{$key}={$value}";

            if (preg_match($pattern, $content)) {
                // Update existing key
                $content = preg_replace($pattern, $replacement, $content);
            } else {
                // Add new key at the end
                $content .= "\n{$key}={$value}";
            }
        }

        file_put_contents($envFile, $content);
    }
}
