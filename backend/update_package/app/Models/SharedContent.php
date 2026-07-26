<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SharedContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'send_to',
        'share_date',
        'valid_upto',
        'shared_by',
        'description',
    ];

    protected $casts = [
        'share_date' => 'date',
        'valid_upto' => 'date',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'shared_by');
    }
}
