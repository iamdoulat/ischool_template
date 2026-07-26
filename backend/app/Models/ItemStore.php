<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemStore extends Model
{
    protected $fillable = [
        'item_store',
        'code',
        'description',
    ];
}
