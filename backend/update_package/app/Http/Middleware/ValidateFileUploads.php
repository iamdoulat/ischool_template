<?php

namespace App\Http\Middleware;

use App\Services\FileValidationService;
use Closure;
use Illuminate\Http\Request;

class ValidateFileUploads
{
    /**
     * Handle an incoming request and validate all file uploads against File Types security criteria.
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->hasFile('') || count($request->allFiles()) > 0) {
            FileValidationService::validateRequest($request);
        }

        return $next($request);
    }
}
