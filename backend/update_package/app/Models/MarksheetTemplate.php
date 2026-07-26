<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarksheetTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'exam_name',
        'school_name',
        'exam_center',
        'body_text',
        'footer_text',
        'printing_date',
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
        'show_exam_number',
        'show_admission_no',
        'show_division',
        'show_roll_no',
        'show_photo',
        'show_class',
        'show_section',
        'show_status',
        'show_remark',
        'is_active'
    ];

    protected $casts = [
        'show_name' => 'boolean',
        'show_father_name' => 'boolean',
        'show_mother_name' => 'boolean',
        'show_exam_number' => 'boolean',
        'show_admission_no' => 'boolean',
        'show_division' => 'boolean',
        'show_roll_no' => 'boolean',
        'show_photo' => 'boolean',
        'show_class' => 'boolean',
        'show_section' => 'boolean',
        'show_status' => 'boolean',
        'show_remark' => 'boolean',
        'is_active' => 'boolean'
    ];
}
