<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportRouteVehicle extends Model
{
    use HasFactory;

    protected $table = 'transport_route_vehicles';

    protected $fillable = [
        'route_id',
        'vehicle_id',
    ];

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'route_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(TransportVehicle::class, 'vehicle_id');
    }
}
