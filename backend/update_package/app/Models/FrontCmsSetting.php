<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrontCmsSetting extends Model
{
    protected $fillable = [
        'is_active',
        'sidebar_active',
        'rtl_mode',
        'sidebar_options',
        'language',
        'logo',
        'favicon',
        'footer_text',
        'cookie_consent',
        'google_analytics',
        'social_media',
        'current_theme',
        'about_us',
        'main_courses',
        'experienced_staffs',
        'latest_notices',
        'header_footer_sections'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sidebar_active' => 'boolean',
        'rtl_mode' => 'boolean',
        'sidebar_options' => 'array',
        'social_media' => 'array',
        'about_us' => 'array',
        'main_courses' => 'array',
        'experienced_staffs' => 'array',
        'latest_notices' => 'array',
        'header_footer_sections' => 'array',
    ];
}
