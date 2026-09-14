import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { safeStorage } from '@/lib/utils';
import { tokenManager } from '@/lib/token-manager';

// Extend axios config to allow suppressing global error toast or fine-tuning caching
declare module 'axios' {
    interface AxiosRequestConfig {
        skipGlobalErrorHandler?: boolean;
        skipCache?: boolean;
        cacheTTL?: number; // Milliseconds to cache
    }
}

const getBaseUrl = () => {
    // In browser: Route through Next.js reverse proxy (/api/v1) on the current origin
    // This hides backend port/IP from browser devtools and eliminates CORS
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/api/v1`;
    }
    // On server (SSR, Server Actions, RSC): Call backend directly
    if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return 'http://127.0.0.1:8000/api/v1';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 60000,
});

// ── In-Memory Cache & Promise Deduplication for Fast Navigation ──────────────
interface CacheEntry {
    data: unknown;
    expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<AxiosResponse>>();

// Endpoints that are safe and highly beneficial to cache across route transitions
const CACHEABLE_URL_PREFIXES = [
    '/system-setting/general-setting',
    '/system-setting/languages',
    '/system-setting/currencies',
    '/system-setting/sessions',
    '/system-setting/sidebar-menus',
    '/profile',
];

function isCacheableGet(url?: string): boolean {
    if (!url) return false;
    return CACHEABLE_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

function getCacheKey(config: InternalAxiosRequestConfig): string {
    const paramsStr = config.params ? JSON.stringify(config.params) : '';
    return `${config.method}:${config.url}:${paramsStr}`;
}

export function clearApiCache(prefix?: string) {
    if (!prefix) {
        responseCache.clear();
        return;
    }
    for (const key of responseCache.keys()) {
        if (key.includes(prefix)) {
            responseCache.delete(key);
        }
    }
}

export function setCachedProfile(user: unknown) {
    if (!user) return;
    const cacheKey = 'get:/profile:';
    responseCache.set(cacheKey, {
        data: { status: 'Success', message: 'User profile retrieved', data: user },
        expiresAt: Date.now() + 60000,
    });
}

// Intercept requests for token, FormData, and in-memory caching
api.interceptors.request.use(async (config) => {
    let token = tokenManager.getToken();
    if (!token && typeof window !== 'undefined') {
        token = await tokenManager.syncSession();
    }
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Determine active branch based on current URL path or storage
    if (typeof window !== 'undefined' && window.location?.pathname) {
        const pathname = window.location.pathname;
        const branchMatch = pathname.match(/^\/br\/([^\/]+)/);
        if (branchMatch && branchMatch[1] !== 'main') {
            // Under sub-branch URL /br/[slug]...
            const branchSlug = branchMatch[1];
            const activeBranchSlug = safeStorage.getItem('active_branch_slug');
            const activeBranchId = safeStorage.getItem('active_branch_id');
            if (activeBranchSlug === branchSlug && activeBranchId) {
                config.headers['X-Branch-Id'] = activeBranchId;
            } else {
                config.headers['X-Branch-Id'] = branchSlug;
            }
        } else {
            // Main campus /dashboard/... or / -> always send 'main'
            config.headers['X-Branch-Id'] = 'main';
        }
    } else {
        const activeBranchId = safeStorage.getItem('active_branch_id');
        if (activeBranchId) {
            config.headers['X-Branch-Id'] = activeBranchId;
        }
    }

    // Let Axios auto-set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const method = config.method?.toLowerCase();

    // Invalidate cache on write operations (mutations)
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
        clearApiCache();
    }

    return config;
});

// Response Interceptor: handle caching, auth, and errors
api.interceptors.response.use(
    (response) => {
        const config = response.config;
        const method = config.method?.toLowerCase();

        // Cache successful cacheable GET responses
        if (method === 'get' && !config.skipCache && isCacheableGet(config.url)) {
            const cacheKey = getCacheKey(config);
            const ttl = config.cacheTTL || 45000; // 45 seconds default TTL
            responseCache.set(cacheKey, {
                data: response.data,
                expiresAt: Date.now() + ttl,
            });
        }

        return response;
    },
    (error) => {
        const config = error.config as InternalAxiosRequestConfig & { skipGlobalErrorHandler?: boolean };
        if (config?.skipGlobalErrorHandler) {
            return Promise.reject(error);
        }

        if (!error.response) {
            if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED') {
                return Promise.reject(error);
            }
            const method = config?.method?.toLowerCase();
            if (typeof window !== 'undefined' && method && method !== 'get') {
                toast.error('Cannot reach the server. Please check that the API is running and try again.');
            }
            return Promise.reject(error);
        }

        const message = error.response?.data?.message || error.message || 'Something went wrong';

        if (error.response?.status === 401) {
            const resConfig = error.response?.config as (InternalAxiosRequestConfig & { skipGlobalErrorHandler?: boolean }) | undefined;
            const isOptedOut = config?.skipGlobalErrorHandler || resConfig?.skipGlobalErrorHandler;
            if (!isOptedOut && typeof window !== 'undefined') {
                const path = window.location.pathname;
                const branchMatch = path.match(/^\/br\/([^\/]+)/);
                const branchSlug = branchMatch ? branchMatch[1] : (safeStorage.getItem('active_branch_slug') || '');
                const targetLogin = branchSlug && branchSlug !== 'main' ? `/br/${branchSlug}/login` : '/login';

                const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/user') || path.includes('/dashboard') || path.includes('/user');
                if (isProtectedRoute && !path.includes('/login')) {
                    tokenManager.clearToken();
                    window.location.href = targetLogin;
                }
            }
        } else if (error.response?.status !== 422) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

// Wrap api.get with cache check and request deduplication
const originalGet = api.get.bind(api);

api.get = function <T = unknown, R = AxiosResponse<T>, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>
): Promise<R> {
    const isCacheable = !config?.skipCache && isCacheableGet(url);

    if (isCacheable) {
        const cacheKey = `get:${url}:${config?.params ? JSON.stringify(config.params) : ''}`;
        const cached = responseCache.get(cacheKey);

        if (cached && cached.expiresAt > Date.now()) {
            // Return cached response instantly (0ms network delay)
            return Promise.resolve({
                data: cached.data,
                status: 200,
                statusText: 'OK (Cache)',
                headers: {},
                config: (config || {}) as InternalAxiosRequestConfig<D>,
            } as unknown as R);
        }

        // Request deduplication: if the exact same request is already in-flight, reuse it
        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey) as unknown as Promise<R>;
        }

        const promise = originalGet<T, R, D>(url, config).finally(() => {
            pendingRequests.delete(cacheKey);
        });

        pendingRequests.set(cacheKey, promise as unknown as Promise<AxiosResponse>);
        return promise;
    }

    return originalGet<T, R, D>(url, config);
};

export default api;
