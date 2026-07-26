<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportRoute extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
    ];

    public function pickupPoints()
    {
        return $this->belongsToMany(TransportPickupPoint::class, 'transport_route_pickup_points', 'route_id', 'pickup_point_id')
            ->withPivot(['id', 'monthly_fees', 'distance', 'pickup_time'])
            ->withTimestamps();
    }

    public function vehicles()
    {
        return $this->belongsToMany(TransportVehicle::class, 'transport_route_vehicles', 'route_id', 'vehicle_id')
            ->withTimestamps();
    }
}
