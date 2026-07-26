<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz',
        'exam',
        'assignment',
        'aws_access_key_id',
        'aws_secret_access_key',
        'aws_bucket_name',
        'aws_region',
        'guest_login',
        'guest_user_prefix',
        'guest_user_id_start',
    ];

    protected $casts = [
        'quiz' => 'boolean',
        'exam' => 'boolean',
        'assignment' => 'boolean',
        'guest_login' => 'boolean',
        'guest_user_id_start' => 'integer',
    ];
}
