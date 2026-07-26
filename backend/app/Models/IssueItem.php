<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueItem extends Model
{
    protected $fillable = [
        'item_category_id',
        'item_id',
        'user_type',
        'issue_to',
        'issue_by',
        'issue_date',
        'return_date',
        'quantity',
        'note',
        'status',
    ];

    public function itemCategory()
    {
        return $this->belongsTo(ItemCategory::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
