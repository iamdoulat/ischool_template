<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'item_name',
        'item_category_id',
        'unit',
        'description',
    ];

    protected $appends = ['available_quantity'];

    public function getAvailableQuantityAttribute()
    {
        $stock = $this->item_stocks_sum_quantity ?? 0;
        $issued = $this->issue_items_sum_quantity ?? 0;
        return $stock - $issued;
    }

    public function itemCategory()
    {
        return $this->belongsTo(ItemCategory::class);
    }

    public function itemStocks()
    {
        return $this->hasMany(ItemStock::class);
    }

    public function issueItems()
    {
        return $this->hasMany(IssueItem::class);
    }
}
