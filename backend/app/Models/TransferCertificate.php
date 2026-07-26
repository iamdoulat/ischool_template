<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'tc_number',
        'student_id',
        'school_class_id',
        'section_id',
        'student_name',
        'admission_no',
        'reason',
        'issue_date',
        'is_reissue',
        'meta',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'is_reissue' => 'boolean',
        'meta' => 'array',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
