<?php

namespace App\Models;

use App\Traits\ScopesByAcademicSession;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassTimetable extends Model
{
    use HasFactory, ScopesByAcademicSession;

    protected $fillable = [
        'school_class_id',
        'section_id',
        'subject_group_id',
        'subject_id',
        'staff_id',
        'day',
        'start_time',
        'end_time',
        'room',
        'academic_session_id',
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function subjectGroup()
    {
        return $this->belongsTo(SubjectGroup::class, 'subject_group_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function academicSession()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }
}
