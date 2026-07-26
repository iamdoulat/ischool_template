<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\DownloadCenter\ContentTypeController;
use App\Http\Controllers\Api\v1\DownloadCenter\VideoTutorialController;
use App\Http\Controllers\Api\v1\DownloadCenter\SharedContentController;
use App\Http\Controllers\Api\v1\DownloadCenter\UploadedContentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('download-center/content-types', ContentTypeController::class);
    Route::apiResource('download-center/video-tutorials', VideoTutorialController::class);
    Route::apiResource('download-center/shared-contents', SharedContentController::class);
    Route::get('download-center/uploaded-contents/stats', [UploadedContentController::class, 'stats']);
    Route::apiResource('download-center/uploaded-contents', UploadedContentController::class);
});
