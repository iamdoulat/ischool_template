<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomField extends Model
{
    protected $fillable = [
        'belongs_to',
        'field_type',
        'name',
        'grid',
        'field_values',
        'is_required',
        'visible_on_table',
    ];

    protected $casts = [
        'grid' => 'integer',
        'is_required' => 'boolean',
        'visible_on_table' => 'boolean',
    ];
}
