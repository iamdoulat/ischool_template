<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f3f4f6; }
        .email-container { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { background-color: #1f2937; padding: 20px; color: #ffffff; }
        .header table { width: 100%; border-collapse: collapse; }
        .header-left { width: 60%; vertical-align: top; }
        .header-right { width: 40%; vertical-align: top; text-align: right; font-size: 12px; font-weight: 500; }
        .school-name { font-size: 20px; font-weight: bold; border-bottom: 1px solid #9ca3af; padding-bottom: 5px; margin: 10px 0 0 0; }
        .logo-img { height: 40px; display: block; margin-bottom: 10px; }
        .body-content { padding: 20px; min-height: 150px; font-size: 14px; }
        .footer { background-color: #f8f9fa; border-top: 4px solid #2196f3; border-bottom: 4px solid #ff9800; padding: 15px; text-align: center; }
        .footer p { margin: 0; font-size: 12px; color: #4b5563; font-weight: 500; }
    </style>
</head>
<body>
    @php
        $settings = \App\Models\GeneralSetting::first();
        $logo = $settings->admin_logo ?? $settings->app_logo ?? $settings->print_logo;
        $logoUrl = $logo ? url('/uploads/school_content/logo/' . $logo) : null;
    @endphp

    <div class="email-container">
        <div class="header">
            <table>
                <tr>
                    <td class="header-left">
                        @if($logoUrl)
                            <img src="{{ $logoUrl }}" class="logo-img" alt="{{ $settings->school_name ?? 'School Logo' }}" />
                        @else
                            <div style="font-weight: 900; font-size: 14px; background-color: #8bc34a; display: inline-block; padding: 4px 10px; border-radius: 4px; border: 2px solid #fff; margin-bottom: 10px;">
                                {{ $settings->school_name ?? 'SMART SCHOOL' }}
                            </div>
                        @endif
                        <h3 class="school-name">{{ $settings->school_name ?? 'Your School Name Here' }}</h3>
                    </td>
                    <td class="header-right">
                        <p style="margin: 0 0 4px 0;">Address: {{ $settings->address ?? 'N/A' }}</p>
                        <p style="margin: 0 0 4px 0;">Phone No.: {{ $settings->phone ?? 'N/A' }}</p>
                        <p style="margin: 0 0 4px 0;">Email: {{ $settings->email ?? 'N/A' }}</p>
                        <p style="margin: 0;">Website: {{ $settings->base_url ?? 'N/A' }}</p>
                    </td>
                </tr>
            </table>
        </div>

        <div class="body-content">
            {!! $messageBody !!}
        </div>

        <div class="footer">
            <p>Note: This email was sent from an email address that can't receive emails. Please don't reply to this email</p>
        </div>
    </div>
</body>
</html>
