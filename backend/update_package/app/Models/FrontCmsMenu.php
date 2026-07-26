<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrontCmsMenu extends Model
{
    protected $guarded = [];

    public function subItems()
    {
        return $this->hasMany(FrontCmsMenu::class, 'parent_id')->orderBy('order', 'asc');
    }

    public function parent()
    {
        return $this->belongsTo(FrontCmsMenu::class, 'parent_id');
    }
}
