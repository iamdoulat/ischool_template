<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAttendance extends Model
{
    protected $fillable = [
        'student_id',
        'attendance_date',
        'attendance',
        'source',
        'reason',
        'entry_time',
        'exit_time',
        'note',
        'ip_address',
        'user_agent',
        'device_serial',
        'scan_location',
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
