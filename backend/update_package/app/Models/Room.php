<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_number',
        'hostel_id',
        'room_type_id',
        'number_of_bed',
        'cost_per_bed',
        'description',
    ];

    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
    }

    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }
}
