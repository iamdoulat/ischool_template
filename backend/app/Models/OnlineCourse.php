<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineCourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'category',
        'instructor_id',
        'instructor_name',
        'image',
        'outline',
        'live_classes',
        'quizzes',
        'price',
        'original_price',
        'class_name',
        'class_id',
        'section_id',
        'total_lessons',
        'total_hours',
        'total_exams',
        'total_assignments',
        'total_quizzes',
    ];

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }
}
