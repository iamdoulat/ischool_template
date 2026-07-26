<?php

use App\Http\Controllers\Api\v1\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('notifications', [NotificationController::class, 'index']);
Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
Route::post('notifications/bulk-read', [NotificationController::class, 'bulkMarkAsRead']);
Route::post('notifications/bulk-delete', [NotificationController::class, 'bulkDelete']);
Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
