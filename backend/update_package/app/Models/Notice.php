<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'publish_date',
        'notice_date',
        'is_published',
        'message_to',
        'notify_to',
    ];

    protected $casts = [
        'publish_date' => 'date',
        'notice_date' => 'date',
        'is_published' => 'boolean',
    ];
}
