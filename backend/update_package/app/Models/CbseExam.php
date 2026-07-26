<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CbseExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'term', 
        'cbse_exam_category_id', 
        'is_published', 
        'is_result_published', 
        'description'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_result_published' => 'boolean'
    ];

    public function category()
    {
        return $this->belongsTo(CbseExamCategory::class, 'cbse_exam_category_id');
    }
}
