<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostalReceive extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_title',
        'reference_no',
        'address',
        'note',
        'to_title',
        'date',
        'attachment',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
