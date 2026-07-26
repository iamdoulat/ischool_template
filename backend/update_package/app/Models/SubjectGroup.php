<?php

namespace App\Models;

use App\Traits\ScopesByAcademicSession;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectGroup extends Model
{
    use HasFactory, ScopesByAcademicSession;

    protected $fillable = [
        'name',
        'school_class_id',
        'description',
        'academic_session_id'
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function sections()
    {
        return $this->belongsToMany(Section::class, 'subject_group_section', 'subject_group_id', 'section_id');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_group_subject', 'subject_group_id', 'subject_id');
    }
}
