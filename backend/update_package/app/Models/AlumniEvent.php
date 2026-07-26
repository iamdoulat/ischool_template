<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlumniEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_title',
        'school_class_id',
        'section_id',
        'session_id',
        'from_date',
        'to_date',
        'note',
        'photo',
        'show_on_app',
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function session()
    {
        return $this->belongsTo(AcademicSession::class, 'session_id');
    }
}
