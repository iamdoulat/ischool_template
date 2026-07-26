<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use HasFactory;

    protected $fillable = [
        'currency',
        'short_code',
        'symbol',
        'rate',
        'is_base',
        'is_active',
        'is_enabled',
    ];

    protected $casts = [
        'rate' => 'float',
        'is_base' => 'boolean',
        'is_active' => 'boolean',
        'is_enabled' => 'boolean',
    ];
}
