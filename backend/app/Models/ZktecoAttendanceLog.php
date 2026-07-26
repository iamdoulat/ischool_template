<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZktecoAttendanceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_serial',
        'user_pin',
        'punch_time',
        'verify_type',
        'status_code',
        'student_id',
        'school_class_id',
        'section_id',
        'processed',
        'status',
    ];

    protected $casts = [
        'punch_time' => 'datetime',
        'processed' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(ZktecoDevice::class, 'device_serial', 'serial_number');
    }
}
