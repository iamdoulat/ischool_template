import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
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
        const message = error.response?.data?.message || error.message || 'Something went wrong';
        
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                // Avoid an infinite reload loop: only redirect to /login when we
                // are NOT already on a public auth page. The login page itself
                // calls public endpoints on mount that can legitimately 401.
                const path = window.location.pathname;
                const publicAuthPaths = ['/login', '/forgot-password', '/reset-password'];
                const onPublicAuthPage = publicAuthPaths.some(
                    (p) => path === p || path.startsWith(`${p}/`)
                );
                if (!onPublicAuthPage) {
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
