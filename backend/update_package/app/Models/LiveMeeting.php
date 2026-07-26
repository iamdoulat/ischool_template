<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveMeeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'date_time',
        'duration',
        'api_used',
        'created_by',
        'total_join',
        'meeting_id',
        'join_url',
        'status'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
