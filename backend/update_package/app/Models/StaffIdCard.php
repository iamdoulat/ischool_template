<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffIdCard extends Model
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
        'show_staff_name',
        'show_staff_id',
        'show_designation',
        'show_department',
        'show_father_name',
        'show_mother_name',
        'show_joining_date',
        'show_address',
        'show_phone',
        'show_dob',
        'show_qr',
        'is_active',
    ];

    protected $casts = [
        'show_staff_name' => 'boolean',
        'show_staff_id' => 'boolean',
        'show_designation' => 'boolean',
        'show_department' => 'boolean',
        'show_father_name' => 'boolean',
        'show_mother_name' => 'boolean',
        'show_joining_date' => 'boolean',
        'show_address' => 'boolean',
        'show_phone' => 'boolean',
        'show_dob' => 'boolean',
        'show_qr' => 'boolean',
        'is_active' => 'boolean',
    ];
}
