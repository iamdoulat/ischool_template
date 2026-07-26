<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QrAttendanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'auto_attendance',
        'use_sensor_device',
        'use_camera_device',
        'camera_type',
        'ip_camera_url',
        'ip_camera_brand',
        'ip_camera_rtsp_transport',
        'ip_camera_auth_enabled',
        'ip_camera_username',
        'ip_camera_password',
        'notify_in',
        'notify_out',
        'notify_sms',
        'notify_whatsapp'
    ];

    protected $casts = [
        'auto_attendance' => 'boolean',
        'use_sensor_device' => 'boolean',
        'use_camera_device' => 'boolean',
        'ip_camera_auth_enabled' => 'boolean',
        'notify_in' => 'boolean',
        'notify_out' => 'boolean',
        'notify_sms' => 'boolean',
        'notify_whatsapp' => 'boolean'
    ];
}
