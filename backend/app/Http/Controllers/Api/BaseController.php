<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BaseController extends Controller
{
    use ApiResponse;

    /**
     * Send success response (alias for ApiResponse trait).
     */
    protected function sendResponse(mixed $result, string $message = ''): JsonResponse
    {
        return $this->success($result, $message);
    }

    /**
     * Send error response (alias for ApiResponse trait).
     */
    protected function sendError(string $error, array $errorMessages = [], int $code = 404): JsonResponse
    {
        return $this->error($error, $code, $errorMessages);
    }
}
