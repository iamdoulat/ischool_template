<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionFormField extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'field_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
