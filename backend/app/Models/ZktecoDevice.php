<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ZktecoDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'serial_number',
        'ip_address',
        'port',
        'location',
        'device_type',
        'school_class_id',
        'section_id',
        'status',
        'last_push_at',
        'push_count',
        'notes',
    ];

    protected $casts = [
        'last_push_at' => 'datetime',
        'port' => 'integer',
        'push_count' => 'integer',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ZktecoAttendanceLog::class, 'device_serial', 'serial_number');
    }
}
