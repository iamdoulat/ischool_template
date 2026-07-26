<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarksGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_type',
        'name',
        'percent_from',
        'percent_upto',
        'grade_point',
        'description'
    ];
}
