import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseURL = () => {
    let url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';
    if (!url.endsWith('/')) url += '/';
    return url;
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000, // 15 seconds timeout
});

// Request Interceptor - Attach token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API Client] ✓ Token found and attached to request');
        } else {
            console.error('[API Client] ✗ NO TOKEN FOUND IN ASYNCSTORAGE!');
            console.error('[API Client] You may need to log in again.');
        }
        console.log(`[API Client] ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Client] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor - Handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.error('[API Client] 401 UNAUTHORIZED - Token missing or invalid');
            console.error('[API Client] Error message:', error.response?.data?.message);

            // Clear invalid token
            await AsyncStorage.removeItem('token');

            // Redirect to login if on web
            if (typeof window !== 'undefined') {
                console.warn('[API Client] Redirecting to login...');
                // You can uncomment this to auto-redirect
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
