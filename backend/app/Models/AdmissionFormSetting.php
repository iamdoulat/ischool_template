<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionFormSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'fee_policy',
        'office_use_only',
        'terms_conditions',
        'declaration',
    ];
}
