<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseHead extends Model
{
    protected $fillable = [
        'expense_head',
        'description',
        'is_active',
    ];

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
