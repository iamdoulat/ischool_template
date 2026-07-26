<?php

use App\Http\Controllers\Api\v1\CronController;
use Illuminate\Support\Facades\Route;

Route::get('/cron/backup-db', [CronController::class, 'backup']);
