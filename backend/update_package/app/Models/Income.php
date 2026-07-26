<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Income extends Model
{
    protected $fillable = [
        'income_head_id',
        'name',
        'invoice_number',
        'date',
        'amount',
        'document',
        'description',
    ];

    public function incomeHead(): BelongsTo
    {
        return $this->belongsTo(IncomeHead::class);
    }
}
