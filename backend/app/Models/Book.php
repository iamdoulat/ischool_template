<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'book_number',
        'isbn_number',
        'publisher',
        'author',
        'subject',
        'rack_number',
        'qty',
        'available',
        'price',
        'post_date',
    ];

    protected $casts = [
        'post_date' => 'date',
        'price' => 'decimal:2',
        'qty' => 'integer',
        'available' => 'integer',
    ];
}
