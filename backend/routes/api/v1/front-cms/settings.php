<?php

use App\Http\Controllers\Api\v1\SystemSetting\FrontCmsSettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('front-cms')->group(function () {
    Route::get('settings', [FrontCmsSettingController::class, 'index']);
});
