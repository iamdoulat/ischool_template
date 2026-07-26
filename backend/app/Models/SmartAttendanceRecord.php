<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmartAttendanceRecord extends Model
{
    protected $fillable = [
        'user_id',
        'attendance_date',
        'attendance_time',
        'method',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'attendance_date' => 'date:Y-m-d',
        'attendance_time' => 'datetime:H:i:s',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
