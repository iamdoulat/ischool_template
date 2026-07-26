<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends BaseController
{
    /**
     * Display a health check response.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'storage' => $this->checkStorage(),
        ];

        $healthy = !in_array(false, array_column($checks, 'status'), true);

        $data = [
            'version' => '1.0.0',
            'api' => 'iSchool Backend API',
            'status' => $healthy ? 'Healthy' : 'Unhealthy',
            'checks' => $checks,
        ];

        if (!$healthy) {
            return $this->error('One or more services are unhealthy', 503, $data);
        }

        return $this->success($data, 'API is running smoothly');
    }

    /**
     * Check database connection
     *
     * @return array
     */
    private function checkDatabase(): array
    {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            return ['status' => true, 'message' => 'Connected'];
        } catch (\Exception $e) {
            return ['status' => false, 'message' => config('app.debug') ? $e->getMessage() : 'Connection failed'];
        }
    }

    /**
     * Check storage writability
     *
     * @return array
     */
    private function checkStorage(): array
    {
        try {
            $path = storage_path('framework/cache');
            if (!is_writable($path)) {
                return ['status' => false, 'message' => 'Not writable'];
            }
            return ['status' => true, 'message' => 'Writable'];
        } catch (\Exception $e) {
            return ['status' => false, 'message' => $e->getMessage()];
        }
    }

}
