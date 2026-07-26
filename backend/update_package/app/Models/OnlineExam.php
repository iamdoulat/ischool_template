<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'is_quiz',
        'exam_from',
        'exam_to',
        'duration',
        'attempt',
        'passing_percentage',
        'is_published',
        'is_result_published',
        'description'
    ];

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'online_exam_questions')
                    ->withPivot('marks')
                    ->withTimestamps();
    }

    public function attempts()
    {
        return $this->hasMany(OnlineExamAttempt::class, 'online_exam_id');
    }
}
