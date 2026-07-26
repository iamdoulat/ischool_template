<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'purpose',
        'meeting_with',
        'visitor_name',
        'phone',
        'id_card',
        'number_of_person',
        'date',
        'in_time',
        'out_time',
        'note',
        'attachment',
        'source',
    ];

    protected $casts = [
        'date' => 'date',
        'number_of_person' => 'integer',
    ];
}
