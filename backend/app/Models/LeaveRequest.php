<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type_id',
        'leave_from',
        'leave_to',
        'days',
        'apply_date',
        'half_day',
        'status',
        'reason',
        'attachment',
        'admin_remark'
    ];

    protected $casts = [
        'leave_from' => 'date',
        'leave_to' => 'date',
        'apply_date' => 'date',
        'days' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }
}
