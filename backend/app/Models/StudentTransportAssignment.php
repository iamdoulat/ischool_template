<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentTransportAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'route_id',
        'vehicle_id',
        'pickup_point_id',
        'academic_session_id',
        'is_active',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'route_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(TransportVehicle::class, 'vehicle_id');
    }

    public function pickupPoint()
    {
        return $this->belongsTo(TransportPickupPoint::class, 'pickup_point_id');
    }

    public function academicSession()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }
}
