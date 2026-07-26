<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeDiscount extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
        'amount',
        'percentage',
        'use_count',
        'expiry_date',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'amount' => 'float',
        'percentage' => 'float',
        'use_count' => 'integer',
        'expiry_date' => 'date',
    ];
}
