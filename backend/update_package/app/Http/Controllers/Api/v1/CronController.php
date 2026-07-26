<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\v1\SystemSetting\BackupController;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;

class CronController extends Controller
{
    public function backup(Request $request)
    {
        $secretKey = $request->query('secret_key');
        $setting = GeneralSetting::first();

        if ($secretKey && $setting->cron_secret_key === $secretKey) {
            $backupController = new BackupController();
            return $backupController->store();
        }

        return response()->json([
            'status' => 'Error',
            'message' => 'Invalid secret key'
        ], 403);
    }
}
