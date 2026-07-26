<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmissionEnquiry extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'description',
        'note',
        'date',
        'next_follow_up_date',
        'assigned',
        'reference',
        'source',
        'class_id',
        'no_of_child',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'next_follow_up_date' => 'date',
    ];
}
