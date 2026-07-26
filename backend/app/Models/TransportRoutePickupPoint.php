<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportRoutePickupPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_id',
        'pickup_point_id',
        'monthly_fees',
        'distance',
        'pickup_time',
    ];

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'route_id');
    }

    public function pickupPoint()
    {
        return $this->belongsTo(TransportPickupPoint::class, 'pickup_point_id');
    }

    public function assignments()
    {
        return $this->hasMany(StudentTransportAssignment::class, 'route_pickup_point_id');
    }
}
