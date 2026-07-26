<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $fillable = [
        'class_name',
        'section',
        'subject_group',
        'subject',
        'lesson',
        'topic',
        'is_completed',
        'completion_date'
    ];
}
