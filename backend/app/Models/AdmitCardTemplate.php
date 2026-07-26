<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmitCardTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'heading',
        'title',
        'exam_name',
        'school_name',
        'exam_center',
        'footer_text',
        'header_image',
        'left_logo',
        'right_logo',
        'left_sign',
        'middle_sign',
        'right_sign',
        'background_image',
        'show_name',
        'show_father_name',
        'show_mother_name',
        'show_dob',
        'show_admission_no',
        'show_roll_no',
        'show_address',
        'show_gender',
        'show_photo',
        'show_class',
        'show_section',
        'show_exam_number',
        'is_active'
    ];

    protected $casts = [
        'show_name' => 'boolean',
        'show_father_name' => 'boolean',
        'show_mother_name' => 'boolean',
        'show_dob' => 'boolean',
        'show_admission_no' => 'boolean',
        'show_roll_no' => 'boolean',
        'show_address' => 'boolean',
        'show_gender' => 'boolean',
        'show_photo' => 'boolean',
        'show_class' => 'boolean',
        'show_section' => 'boolean',
        'show_exam_number' => 'boolean',
        'is_active' => 'boolean'
    ];
}
