<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamGroup extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'exam_type', 'description'];

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }
}
