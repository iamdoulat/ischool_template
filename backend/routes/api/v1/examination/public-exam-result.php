<?php

use App\Http\Controllers\Api\v1\Examination\PublicExamResultController;
use Illuminate\Support\Facades\Route;

Route::get('examination/public/exam-list', [PublicExamResultController::class, 'getExamList']);
Route::post('examination/public/search-by-admission', [PublicExamResultController::class, 'searchByAdmission']);
