<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeReminder extends Model
{
    protected $fillable = [
        'type',
        'days',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'days' => 'integer',
    ];
}
