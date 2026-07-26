<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportFeeMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'month',
        'due_date',
        'fine_type',
        'fine_percentage',
        'fine_amount',
        'session_id',
    ];

    public function session()
    {
        return $this->belongsTo(AcademicSession::class, 'session_id');
    }
}
