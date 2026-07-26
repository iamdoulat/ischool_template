<?php

use App\Http\Controllers\Api\v1\Hostel\HostelController;
use Illuminate\Support\Facades\Route;

Route::apiResource('hostels', HostelController::class);
