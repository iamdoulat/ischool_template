<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Communicate\NoticeController;

// Public: anyone can view notices
Route::get('communicate/notices', [NoticeController::class, 'index']);
Route::get('communicate/notices/{notice}', [NoticeController::class, 'show']);

// Protected: mutations require auth
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('communicate/notices/destroy-all', [NoticeController::class, 'destroyAll']);
    Route::post('communicate/notices', [NoticeController::class, 'store']);
    Route::put('communicate/notices/{notice}', [NoticeController::class, 'update']);
    Route::patch('communicate/notices/{notice}', [NoticeController::class, 'update']);
    Route::delete('communicate/notices/{notice}', [NoticeController::class, 'destroy']);
});
