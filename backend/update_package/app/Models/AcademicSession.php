<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
