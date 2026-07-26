<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffAttendance extends Model
{
    protected $fillable = [
        'user_id',
        'attendance_date',
        'attendance',
        'source',
        'entry_time',
        'exit_time',
        'note',
        'ip_address',
        'user_agent',
        'device_serial',
        'scan_location',
    ];

    protected $casts = [
        'attendance_date' => 'date:Y-m-d',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
