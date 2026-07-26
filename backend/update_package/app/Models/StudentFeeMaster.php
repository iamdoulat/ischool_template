<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentFeeMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'fee_master_id',
        'academic_session_id',
        'is_active',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function feeMaster()
    {
        return $this->belongsTo(FeeMaster::class);
    }

    public function academicSession()
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function payments()
    {
        return $this->hasMany(FeePayment::class);
    }
}
