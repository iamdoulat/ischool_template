<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #6366f1; font-size: 22px; margin: 0;">Welcome to {{ $schoolName }}</h1>
    </div>
    <p style="font-size: 15px;">Dear {{ $name }},</p>
    <p style="font-size: 15px;">Your login credentials have been created. Please use the following information to log into the system:</p>
    <div style="background: #f8f9fa; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Username:</strong> {{ $username ?: $admissionNo }}</p>
        <p style="margin: 5px 0;"><strong>Admission No:</strong> {{ $admissionNo }}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> {{ $password }}</p>
    </div>
    <p style="font-size: 13px; color: #666;">For security reasons, please change your password after your first login.</p>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>This email was sent from the iSchool system.</p>
    </div>
</body>
</html>
