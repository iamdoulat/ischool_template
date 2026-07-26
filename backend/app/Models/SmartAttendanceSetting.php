<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmartAttendanceSetting extends Model
{
    protected $fillable = [
        'is_face_enabled',
        'is_qr_enabled',
        'is_nfc_enabled',
    ];

    protected $casts = [
        'is_face_enabled' => 'boolean',
        'is_qr_enabled' => 'boolean',
        'is_nfc_enabled' => 'boolean',
    ];
}
