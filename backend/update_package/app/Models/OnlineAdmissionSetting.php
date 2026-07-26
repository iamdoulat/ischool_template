<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineAdmissionSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'online_admission',
        'online_admission_payment_option',
        'online_admission_form_fees',
        'instructions',
        'terms_conditions',
        'admission_form_path',
    ];

    protected $casts = [
        'online_admission' => 'boolean',
        'online_admission_payment_option' => 'boolean',
        'online_admission_form_fees' => 'decimal:2',
    ];
}
