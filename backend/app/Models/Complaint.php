<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'complaint_id',
        'complaint_type',
        'source',
        'complain_by',
        'phone',
        'date',
        'description',
        'action_taken',
        'assigned',
        'note',
        'attachment',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
