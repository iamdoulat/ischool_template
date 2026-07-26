<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherRating extends Model
{
    protected $fillable = [
        'staff_id',
        'staff_name',
        'rating',
        'comment',
        'status',
        'student_name'
    ];
}
