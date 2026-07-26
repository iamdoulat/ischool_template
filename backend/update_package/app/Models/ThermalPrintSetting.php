<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThermalPrintSetting extends Model
{
    protected $fillable = ['status', 'school_name', 'address', 'footer_text'];

    protected $casts = [
        'status' => 'boolean',
    ];
}
