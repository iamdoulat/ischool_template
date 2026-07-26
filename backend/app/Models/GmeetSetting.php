<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GmeetSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'api_key',
        'api_secret',
        'use_calendar_api',
        'forgot_live_class',
    ];

    protected $casts = [
        'use_calendar_api' => 'boolean',
        'forgot_live_class' => 'boolean',
    ];
}
