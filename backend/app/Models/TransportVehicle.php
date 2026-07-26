<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportVehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_no',
        'vehicle_model',
        'year_made',
        'registration_no',
        'chassis_no',
        'max_seating_capacity',
        'driver_name',
        'driver_license',
        'driver_contact',
        'note',
    ];

    public function routes()
    {
        return $this->belongsToMany(TransportRoute::class, 'transport_route_vehicles', 'vehicle_id', 'route_id')
            ->withTimestamps();
    }
}
