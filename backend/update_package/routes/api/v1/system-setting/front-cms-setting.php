<?php

use App\Http\Controllers\Api\v1\SystemSetting\FrontCmsSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('system-setting')->group(function () {
// Note: Using relative paths (no leading slash) to avoid baseURL issues in Axios
    Route::get('front-cms-settings', [FrontCmsSettingController::class, 'index']);
    Route::post('front-cms-settings', [FrontCmsSettingController::class, 'store']);
});
