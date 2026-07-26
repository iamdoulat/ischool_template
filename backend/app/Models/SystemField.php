<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemField extends Model
{
    protected $fillable = [
        'name',
        'alias',
        'scope',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
