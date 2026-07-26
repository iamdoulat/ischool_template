<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeMaster extends Model
{
    protected $fillable = [
        'fee_group_id',
        'fee_type_id',
        'due_date',
        'amount',
        'fine_type',
        'fine_percentage',
        'fine_amount',
        'fine_per_day',
        'fine_tiers',
        'session_id',
    ];

    protected $casts = [
        'fine_tiers' => 'array',
        'fine_per_day' => 'boolean',
    ];

    public function feeGroup()
    {
        return $this->belongsTo(FeeGroup::class);
    }

    public function feeType()
    {
        return $this->belongsTo(FeeType::class);
    }

    public function session()
    {
        return $this->belongsTo(AcademicSession::class, 'session_id');
    }
}
