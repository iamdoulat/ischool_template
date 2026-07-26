<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_fee_master_id',
        'student_transport_fee_id',
        'collected_by',
        'amount',
        'discount',
        'fine',
        'payment_mode',
        'note',
        'date',
    ];

    public function studentFeeMaster()
    {
        return $this->belongsTo(StudentFeeMaster::class);
    }

    public function studentTransportFee()
    {
        return $this->belongsTo(StudentTransportFee::class);
    }

    public function collectedBy()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
