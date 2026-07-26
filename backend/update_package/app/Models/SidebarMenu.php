<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SidebarMenu extends Model
{
    protected $fillable = [
        'name',
        'label',
        'is_visible',
        'sort_order',
        'submenu_order',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
        'submenu_order' => 'array',
    ];
}
