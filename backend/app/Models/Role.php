<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'is_system'];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }

    public function dashboardWidgets()
    {
        return $this->hasMany(RoleDashboardWidget::class);
    }
}
