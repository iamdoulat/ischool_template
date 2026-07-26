<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileUploadSetting extends Model
{
    protected $fillable = [
        'file_extension',
        'file_mime',
        'file_size',
        'image_extension',
        'image_mime',
        'image_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'image_size' => 'integer',
    ];
}
