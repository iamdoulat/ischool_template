<!DOCTYPE html>
<html>

<head>
    <title>Reset Your Password</title>
</head>

<body style="font-family: sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px;">
        <h2>Hello, {{ $user->name }}</h2>
        <p>A password reset was requested for your account. Click the button below to set a new password:</p>
        <p style="text-align: center;">
            <a href="{{ $resetUrl }}"
                style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset
                Password</a>
        </p>
        <p>This link will expire in 60 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message from {{ config('app.name') }}.</p>
    </div>
</body>

</html>