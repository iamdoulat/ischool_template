<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineCoursePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'income_id',
        'amount',
        'payment_method',
        'payment_date',
        'invoice_no',
        'status',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course()
    {
        return $this->belongsTo(OnlineCourse::class, 'course_id');
    }

    public function income()
    {
        return $this->belongsTo(Income::class, 'income_id');
    }
}
