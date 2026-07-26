<?php

namespace App\Models;

use App\Traits\ScopesByAcademicSession;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory, ScopesByAcademicSession;

    protected $fillable = [
        'name',
        'code',
        'type',
        'academic_session_id'
    ];
}
