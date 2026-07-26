<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'online_exam_id',
        'student_id',
        'started_at',
        'completed_at',
        'total_questions',
        'total_marks',
        'earned_marks',
        'status',
        'is_submitted'
    ];

    public function exam()
    {
        return $this->belongsTo(OnlineExam::class, 'online_exam_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
