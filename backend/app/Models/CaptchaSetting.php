<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaptchaSetting extends Model
{
    protected $fillable = [
        'name',
        'alias',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
