<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_timetable_id',
        'date',
        'lesson',
        'topic',
        'sub_topic',
        'presentation',
        'objectives',
        'attachment'
    ];

    public function classTimetable()
    {
        return $this->belongsTo(ClassTimetable::class);
    }
}
