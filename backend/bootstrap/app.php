<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The built-in HandleCors middleware is usually enough.
        // We'll remove the custom one to avoid duplicate header errors.

        // Protect API routes — only whitelisted public routes pass through
        $middleware->api(prepend: [
            \App\Http\Middleware\EnsureApiAuthenticated::class,
            \App\Http\Middleware\ValidateFileUploads::class,
        ]);

        // Return 401 JSON for unauthenticated API requests instead of redirecting
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                abort(response()->json(['message' => 'Unauthenticated.'], 401));
            }
            return '/login';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
