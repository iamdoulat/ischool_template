<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentTransportFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'transport_fee_master_id',
        'amount',
        'status',
        'academic_session_id',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function transportFeeMaster()
    {
        return $this->belongsTo(TransportFeeMaster::class, 'transport_fee_master_id');
    }

    public function session()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function payments()
    {
        return $this->hasMany(FeePayment::class, 'student_transport_fee_id');
    }
}
