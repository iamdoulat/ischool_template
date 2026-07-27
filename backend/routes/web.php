<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/migrate-now', function () {
    \Illuminate\Support\Facades\Artisan::call('migrate');
    return response()->json(['message' => 'Migrated', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
});

Route::get('/storage-link', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('storage:link');
        return response()->json(['message' => 'Storage link created', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::get('/storage/{path}', function ($path) {
    $candidates = [
        public_path('storage/' . $path),
        public_path('uploads/' . $path),
        public_path($path),
        storage_path('app/public/' . $path),
        storage_path('app/' . $path),
    ];

    foreach ($candidates as $fullPath) {
        if (file_exists($fullPath) && !is_dir($fullPath)) {
            $file = file_get_contents($fullPath);
            $type = @mime_content_type($fullPath) ?: 'image/png';
            return response($file, 200)
                ->header("Content-Type", $type)
                ->header("Access-Control-Allow-Origin", "*")
                ->header("Access-Control-Allow-Methods", "GET, OPTIONS")
                ->header("Cache-Control", "public, max-age=31536000, immutable");
        }
    }

    abort(404);
})->where('path', '.*');

Route::get('/uploads/{path}', function ($path) {
    $candidates = [
        public_path('uploads/' . $path),
        public_path('storage/' . $path),
        public_path($path),
        storage_path('app/public/' . $path),
        storage_path('app/' . $path),
    ];

    foreach ($candidates as $fullPath) {
        if (file_exists($fullPath) && !is_dir($fullPath)) {
            $file = file_get_contents($fullPath);
            $type = @mime_content_type($fullPath) ?: 'image/png';
            return response($file, 200)
                ->header("Content-Type", $type)
                ->header("Access-Control-Allow-Origin", "*")
                ->header("Access-Control-Allow-Methods", "GET, OPTIONS")
                ->header("Cache-Control", "public, max-age=31536000, immutable");
        }
    }

    abort(404);
})->where('path', '.*');

Route::get('/test-search-students', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\User::role('Student');
    if ($request->filled('school_class_id')) {
        $query->where('school_class_id', $request->school_class_id);
    }
    if ($request->filled('section_id')) {
        $query->where('section_id', $request->section_id);
    }
    return response()->json($query->get());
});

// ZKTeco Root ADMS Endpoints
Route::any('/iclock/cdata.php', [\App\Http\Controllers\Api\v1\Attendance\ZktecoAdmsController::class, 'handleCData']);
Route::any('/iclock/cdata', [\App\Http\Controllers\Api\v1\Attendance\ZktecoAdmsController::class, 'handleCData']);
Route::get('/iclock/getrequest.php', [\App\Http\Controllers\Api\v1\Attendance\ZktecoAdmsController::class, 'handleGetRequest']);
Route::get('/iclock/getrequest', [\App\Http\Controllers\Api\v1\Attendance\ZktecoAdmsController::class, 'handleGetRequest']);

