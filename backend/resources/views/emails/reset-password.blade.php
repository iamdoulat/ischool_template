<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #6366f1; font-size: 22px; margin: 0;">Reset Your Password</h1>
    </div>
    <p style="font-size: 15px;">You are receiving this email because we received a password reset request for your account.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $resetLink }}" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #666;">This password reset link will expire in 60 minutes.</p>
    <p style="font-size: 13px; color: #666;">If you did not request a password reset, no further action is required.</p>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>This email was sent from the iSchool system.</p>
    </div>
</body>
</html>
