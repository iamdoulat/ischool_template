<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LibraryMember extends Model
{
    protected $fillable = [
        'user_id',
        'library_card_no',
        'member_id',
        'member_type',
        'active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
