<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportPickupPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
    ];

    public function routes()
    {
        return $this->belongsToMany(TransportRoute::class, 'transport_route_pickup_points', 'pickup_point_id', 'route_id')
            ->withPivot(['id', 'monthly_fees', 'distance', 'pickup_time'])
            ->withTimestamps();
    }
}
