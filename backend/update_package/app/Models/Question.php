<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_name',
        'section',
        'subject',
        'question_type',
        'level',
        'question',
        'options',
        'correct_answer',
        'created_by'
    ];

    protected $casts = [
        'options' => 'array'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
