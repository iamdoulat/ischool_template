<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnnualCalendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'start_date',
        'end_date',
        'holiday_type_id',
        'description',
        'created_by',
        'is_front_site'
    ];

    public function holidayType()
    {
        return $this->belongsTo(HolidayType::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
