import axios, { type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Extend axios config to allow suppressing the global error toast per-request
declare module 'axios' {
    interface AxiosRequestConfig {
        skipGlobalErrorHandler?: boolean;
    }
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 60000, // 60 second timeout for slow endpoints
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Let Axios auto-set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

// Add a response interceptor to handle authentication and general errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip the global error handling / redirects for requests that opted out (e.g. background polling or custom components)
        const config = error.config as InternalAxiosRequestConfig & { skipGlobalErrorHandler?: boolean };
        if (config?.skipGlobalErrorHandler) {
            return Promise.reject(error);
        }

        // No `error.response` means the request never got an HTTP reply: the
        // backend is down/restarting, the network dropped, or the request was
        // cancelled (e.g. Fast Refresh / navigation). Surface a clear message
        // instead of a raw "Network Error" and skip the 401 redirect logic.
        if (!error.response) {
            if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED') {
                return Promise.reject(error);
            }
            if (typeof window !== 'undefined') {
                toast.error('Cannot reach the server. Please check that the API is running and try again.');
            }
            return Promise.reject(error);
        }

        const message = error.response?.data?.message || error.message || 'Something went wrong';

        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                // Only redirect to /login if the user is on a protected route (/dashboard or /user)
                const path = window.location.pathname;
                const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/user');
                if (isProtectedRoute) {
                    window.location.href = '/login';
                }
            }
        } else if (error.response?.status !== 422) {
            // Show toast for non-validation errors (422 is usually handled per-form)
            toast.error(message);
        }
        
        return Promise.reject(error);
    }
);

export default api;
