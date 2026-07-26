<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Success Response
     *
     * @param mixed $data
     * @param string|null $message
     * @param int $code
     * @return JsonResponse
     */
    protected function success(mixed $data, string $message = null, int $code = 200): JsonResponse
    {
        return response()->json([
            'status' => 'Success',
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Error Response
     *
     * @param string|null $message
     * @param int $code
     * @param mixed|null $data
     * @return JsonResponse
     */
    protected function error(string $message = null, int $code, mixed $data = null): JsonResponse
    {
        return response()->json([
            'status' => 'Error',
            'success' => false,
            'message' => $message,
            'data' => $data
        ], $code);
    }
}
