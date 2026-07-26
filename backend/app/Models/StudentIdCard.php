<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentIdCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'school_name',
        'school_address',
        'header_color',
        'background_image',
        'logo',
        'signature',
        'design_type',
        'show_admission_no',
        'show_student_name',
        'show_class',
        'show_father_name',
        'show_mother_name',
        'show_address',
        'show_phone',
        'show_dob',
        'show_blood_group',
        'show_qr',
        'show_roll_no',
        'show_house',
        'is_active',
    ];

    protected $casts = [
        'show_admission_no' => 'boolean',
        'show_student_name' => 'boolean',
        'show_class' => 'boolean',
        'show_father_name' => 'boolean',
        'show_mother_name' => 'boolean',
        'show_address' => 'boolean',
        'show_phone' => 'boolean',
        'show_dob' => 'boolean',
        'show_blood_group' => 'boolean',
        'show_qr' => 'boolean',
        'show_roll_no' => 'boolean',
        'show_house' => 'boolean',
        'is_active' => 'boolean',
    ];
}
