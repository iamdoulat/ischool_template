<?php

namespace Database\Seeders;

use App\Models\FileUploadSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FileUploadSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        FileUploadSetting::updateOrCreate([], [
            'file_extension' => 'pdf, zip, jpg, jpeg, png, txt, 7z, gif, csv, docx, mp3, mp4, accdb, odt, ods, ppt, pptx, xlsx, wmv, jfif, apk, bmp, jpe, mdb, rar, xls, svg',
            'file_mime' => 'application/pdf, image/zip, image/jpg, image/png, image/jpeg, text/plain, application/x-zip-compressed, application/zip, image/gif, text/csv, application/vnd.openxmlformats-officedocument.wordprocessingml.document, audio/mpeg, application/msaccess, application/vnd.oasis.opendocument.text, application/vnd.oasis.opendocument.spreadsheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, video/x-ms-wmv, video/mp4, application/vnd.android.package-archive, application/x-msdownload, image/bmp, application/vnd.ms-excel, image/svg+xml',
            'file_size' => 100048576,
            'image_extension' => 'jfif, png, jpe, jpeg, jpg, bmp, gif, svg, webp',
            'image_mime' => 'image/jpeg, image/png, image/jpg, image/bmp, image/gif, image/x-ms-bmp, image/svg+xml, image/webp',
            'image_size' => 10048576,
        ]);
    }
}
