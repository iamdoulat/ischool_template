<?php

use App\Http\Controllers\Api\v1\Hostel\RoomController;
use App\Http\Controllers\Api\v1\Hostel\RoomTypeController;
use Illuminate\Support\Facades\Route;

Route::apiResource('room-types', RoomTypeController::class);
Route::apiResource('rooms', RoomController::class);
