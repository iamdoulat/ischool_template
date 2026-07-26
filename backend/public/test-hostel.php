<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$hostel = \App\Models\Hostel::create([
    'name' => 'CLI Test Hostel',
    'type' => 'boys',
    'address' => 'CLI Address',
    'intake' => 999,
    'description' => 'CLI Description'
]);

echo json_encode($hostel->toArray());
