<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncomeHead extends Model
{
    protected $fillable = [
        'income_head',
        'description',
        'is_active',
    ];
}
