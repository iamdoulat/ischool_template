<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfflineBankPayment extends Model
{
    protected $fillable = [
        'student_id',
        'student_fee_master_id',
        'course_id',
        'amount',
        'payment_date',
        'reference_no',
        'bank_name',
        'bank_account_no',
        'screenshot',
        'status',
        'status_date',
        'action_by',
        'rejection_reason',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'status_date' => 'datetime',
        'amount' => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function studentFeeMaster()
    {
        return $this->belongsTo(StudentFeeMaster::class);
    }

    public function course()
    {
        return $this->belongsTo(OnlineCourse::class, 'course_id');
    }

    public function actionBy()
    {
        return $this->belongsTo(User::class, 'action_by');
    }
}
