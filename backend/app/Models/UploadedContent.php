<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UploadedContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content_type_id',
        'file_path',
        'file_type',
        'file_size',
        'uploader_id',
        'description',
        'share_date',
        'valid_upto',
        'is_public',
    ];

    protected $casts = [
        'share_date' => 'date',
        'valid_upto' => 'date',
        'is_public' => 'boolean',
    ];

    public function contentType()
    {
        return $this->belongsTo(ContentType::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }
}
