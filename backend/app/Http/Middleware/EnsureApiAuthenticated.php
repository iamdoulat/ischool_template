<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiAuthenticated
{
    private array $publicExact = [
        'api/v1/health-check',
        'api/v1/login',
        'api/v1/forgot-password',
        'api/v1/reset-password',
    ];

    private array $publicPrefixes = [
        'api/v1/cron/',
        'api/v1/online-admissions/',
        'api/v1/examination/public/',
    ];

    private array $publicGetExact = [
        'api/v1/system-setting/general-setting',
        'api/v1/system-setting/online-admission',
        'api/v1/system-setting/sessions',
        'api/v1/front-cms/menus',
        'api/v1/front-cms/pages',
        'api/v1/front-cms/banners',
        'api/v1/front-cms/news',
        'api/v1/front-cms/gallery',
        'api/v1/front-cms/events',
        'api/v1/front-cms/media',
        'api/v1/front-cms/settings',
        'api/v1/communicate/notices',
        'api/v1/dashboard',
        'api/v1/sections',
        'api/v1/classes',
        'api/v1/academics/classes',
        'api/v1/student-categories',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $path = $request->path();
        $method = $request->method();

        if (in_array($path, $this->publicExact)) {
            return $next($request);
        }

        foreach ($this->publicPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return $next($request);
            }
        }

        if ($method === 'GET') {
            if (in_array($path, $this->publicGetExact)) {
                return $next($request);
            }

            if (preg_match('#^api/v1/front-cms/pages/show-by-slug/.+#', $path)) {
                return $next($request);
            }
        }

        if (Auth::guard('sanctum')->check()) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
}
