<?php

namespace App\Models;

use App\Traits\ScopesByAcademicSession;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory, ScopesByAcademicSession;

    protected $fillable = ['name', 'academic_session_id'];

    public function sections()
    {
        return $this->hasMany(Section::class, 'school_class_id');
    }

    public function subjectGroups()
    {
        return $this->hasMany(SubjectGroup::class, 'school_class_id');
    }
}
