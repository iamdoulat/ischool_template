<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BehaviourSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_comment',
        'parent_comment',
    ];

    protected $casts = [
        'student_comment' => 'boolean',
        'parent_comment' => 'boolean',
    ];
}
