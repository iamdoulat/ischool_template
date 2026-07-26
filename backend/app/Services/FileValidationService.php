<?php

namespace App\Services;

use App\Models\FileUploadSetting;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class FileValidationService
{
    /**
     * Dangerous file extensions strictly blacklisted for security.
     */
    protected static array $blacklistedExtensions = [
        'php', 'php3', 'php4', 'php5', 'phtml', 'phar',
        'html', 'htm', 'shtml', 'js', 'jsp', 'asp', 'aspx', 'cgi', 'pl', 'py', 'sh', 'bat', 'cmd',
        'exe', 'com', 'dll', 'vbs', 'vbe', 'jse', 'jar', 'htaccess', 'htpasswd', 'env', 'config'
    ];

    /**
     * Validate an uploaded file against System File Types Security Settings.
     *
     * @param UploadedFile $file
     * @param string $category 'image' | 'file' | 'auto'
     * @throws ValidationException
     */
    public static function validate(UploadedFile $file, string $category = 'auto'): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = strtolower($file->getMimeType() ?: '');
        $size = $file->getSize();

        // 1. Strict Blacklist Check (System Security)
        if (in_array($extension, static::$blacklistedExtensions, true)) {
            throw ValidationException::withMessages([
                'file' => ["Security Error: Uploading executable or script files (.{$extension}) is strictly prohibited."]
            ]);
        }

        // 2. Load File Types Setting from DB
        $setting = FileUploadSetting::first();
        if (!$setting) {
            return;
        }

        $isImage = ($category === 'image') || ($category === 'auto' && str_starts_with($mimeType, 'image/'));

        $allowedExtStr = $isImage && !empty($setting->image_extension)
            ? $setting->image_extension
            : $setting->file_extension;

        $allowedMimeStr = $isImage && !empty($setting->image_mime)
            ? $setting->image_mime
            : $setting->file_mime;

        $maxSize = $isImage && !empty($setting->image_size) && (int)$setting->image_size > 0
            ? (int)$setting->image_size
            : (int)($setting->file_size ?? 0);

        // 3. Extension Validation
        if (!empty(trim($allowedExtStr))) {
            $allowedExtensions = array_filter(array_map(fn($e) => strtolower(trim($e)), explode(',', $allowedExtStr)));
            $allowedExtensions = array_diff($allowedExtensions, static::$blacklistedExtensions);

            if (!empty($allowedExtensions) && !in_array($extension, $allowedExtensions, true)) {
                throw ValidationException::withMessages([
                    'file' => ["File extension '.{$extension}' is not allowed by system security settings. Allowed extensions: " . implode(', ', $allowedExtensions)]
                ]);
            }
        }

        // 4. MIME Type Validation
        if (!empty(trim($allowedMimeStr))) {
            $allowedMimes = array_filter(array_map(fn($m) => strtolower(trim($m)), explode(',', $allowedMimeStr)));
            
            // Normalize MIME check (support wildcard subtype like image/* if configured)
            $mimeAllowed = false;
            foreach ($allowedMimes as $allowedMime) {
                if ($allowedMime === $mimeType) {
                    $mimeAllowed = true;
                    break;
                }
                if (str_contains($allowedMime, '/*')) {
                    $prefix = strtok($allowedMime, '/');
                    if (str_starts_with($mimeType, $prefix . '/')) {
                        $mimeAllowed = true;
                        break;
                    }
                }
            }

            if (!$mimeAllowed) {
                throw ValidationException::withMessages([
                    'file' => ["File MIME type '{$mimeType}' is not permitted by system security criteria."]
                ]);
            }
        }

        // 5. File Size Validation
        if ($maxSize > 0 && $size > $maxSize) {
            $formattedMax = round($maxSize / (1024 * 1024), 2) . ' MB';
            $formattedActual = round($size / (1024 * 1024), 2) . ' MB';
            throw ValidationException::withMessages([
                'file' => ["File size ({$formattedActual}) exceeds the maximum system upload limit of {$formattedMax}."]
            ]);
        }
    }

    /**
     * Recursively validate all uploaded files in a Request.
     *
     * @param Request $request
     * @throws ValidationException
     */
    public static function validateRequest(Request $request): void
    {
        $allFiles = $request->allFiles();
        if (empty($allFiles)) {
            return;
        }

        self::validateFilesArray($allFiles);
    }

    /**
     * Helper to process nested array of UploadedFile objects.
     */
    protected static function validateFilesArray(array $files): void
    {
        foreach ($files as $item) {
            if ($item instanceof UploadedFile) {
                self::validate($item, 'auto');
            } elseif (is_array($item)) {
                self::validateFilesArray($item);
            }
        }
    }
}
