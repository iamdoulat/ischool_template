<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'header_left',
        'header_center',
        'header_right',
        'body_text',
        'footer_left',
        'footer_center',
        'footer_right',
        'header_height',
        'footer_height',
        'body_height',
        'body_width',
        'enable_student_photo',
        'background_image',
        'is_active',
    ];

    protected $casts = [
        'enable_student_photo' => 'boolean',
        'is_active' => 'boolean',
    ];
}
