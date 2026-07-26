<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostalDispatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'to_title',
        'reference_no',
        'address',
        'note',
        'from_title',
        'date',
        'attachment',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
