<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemStock extends Model
{
    protected $fillable = [
        'item_category_id',
        'item_id',
        'item_supplier_id',
        'item_store_id',
        'quantity',
        'purchase_price',
        'date',
        'description',
        'document',
    ];

    public function itemCategory()
    {
        return $this->belongsTo(ItemCategory::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function supplier()
    {
        return $this->belongsTo(ItemSupplier::class, 'item_supplier_id');
    }

    public function store()
    {
        return $this->belongsTo(ItemStore::class, 'item_store_id');
    }
}
