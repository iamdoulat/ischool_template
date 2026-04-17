import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1',
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
    return config;
});

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
