<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ZoomSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'api_key',
        'api_secret',
        'teacher_api_credential',
        'staff_client_type',
        'student_client_type',
        'parent_live_class',
        'access_token'
    ];

    protected $casts = [
        'teacher_api_credential' => 'boolean',
        'parent_live_class' => 'boolean'
    ];
}
