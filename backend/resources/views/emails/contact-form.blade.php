<!DOCTYPE html>
<html>
<head>
    <title>New Contact Form Submission</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2>New Contact Form Submission</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Full Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">{{ $name }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">{{ $email }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee;">Mobile No</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">{{ $mobile }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #eee; vertical-align: top;">Details Info</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">{{ nl2br(e($details)) }}</td>
        </tr>
    </table>
</body>
</html>
