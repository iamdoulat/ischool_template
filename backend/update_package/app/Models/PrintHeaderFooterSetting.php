<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PrintHeaderFooterSetting extends Model
{
    protected $fillable = [
        'type',
        'header_image_path',
        'footer_content',
        'paper_size',
    ];

    /**
     * Get the full URL for the header image
     */
    public function getHeaderImageUrlAttribute(): ?string
    {
        if (!$this->header_image_path) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($this->header_image_path, FILTER_VALIDATE_URL)) {
            return $this->header_image_path;
        }

        // Return storage URL
        return Storage::url($this->header_image_path);
    }

    /**
     * Get the base64 encoded header image
     */
    public function getHeaderImageBase64Attribute(): ?string
    {
        if (!$this->header_image_path) {
            return null;
        }

        try {
            if (Storage::disk('public')->exists($this->header_image_path)) {
                $fileContents = Storage::disk('public')->get($this->header_image_path);
                $mimeType = Storage::disk('public')->mimeType($this->header_image_path);
                return 'data:' . $mimeType . ';base64,' . base64_encode($fileContents);
            }
        } catch (\Exception $e) {
            return null;
        }

        return null;
    }

    /**
     * Append header_image_url to JSON
     */
    protected $appends = ['header_image_url', 'header_image_base64'];

    /**
     * Hide the path in JSON output
     */
    protected $hidden = [];
}
