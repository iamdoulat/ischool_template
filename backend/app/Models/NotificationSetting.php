<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    protected $fillable = [
        'event_name',
        'destinations',
        'recipients',
        'sms_template_id',
        'whatsapp_template_id',
        'sample_message',
        'email_subject',
        'email_template',
        'sms_template',
        'whatsapp_template',
        'mobile_app_template',
        'is_active',
    ];

    protected $casts = [
        'destinations' => 'array',
        'recipients' => 'array',
        'is_active' => 'boolean',
    ];
}
