<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_group_id',
        'marksheet_template_id',
        'name',
        'session',
        'is_published',
        'is_result_published',
        'description'
    ];

    public function examGroup()
    {
        return $this->belongsTo(ExamGroup::class);
    }

    public function marksheetTemplate()
    {
        return $this->belongsTo(MarksheetTemplate::class);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'exam_students', 'exam_id', 'student_id')->withTimestamps();
    }

    public function examSchedules()
    {
        return $this->hasMany(ExamSchedule::class);
    }

    public function examRanks()
    {
        return $this->hasMany(ExamRank::class);
    }
}
