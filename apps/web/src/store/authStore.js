import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo web, we can use localStorage or AsyncStorage mapping
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5032/api';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { token, user } = response.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            set({ user, token, isAuthenticated: true, loading: false });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            set({ error: message, loading: false });
            return { success: false, message };
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadStorage: async () => {
        console.log('[AuthStore] Loading authentication from storage...');
        const token = await AsyncStorage.getItem('token');
        const userJson = await AsyncStorage.getItem('user');
        if (token && userJson) {
            console.log('[AuthStore] Token and user found in storage');
            set({ token, user: JSON.parse(userJson), isAuthenticated: true });
        } else {
            console.warn('[AuthStore] No authentication found in storage');
        }
    },

    checkAuth: async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const user = response.data.user;
                await AsyncStorage.setItem('user', JSON.stringify(user));
                set({ user, isAuthenticated: true });
                console.log('[AuthStore] Session refreshed with latest permissions');
            }
        } catch (error) {
            console.error('[AuthStore] Session validation failed:', error);
            if (error.response?.status === 401) {
                // Token expired
                get().logout();
            }
        }
    }
}));

export default useAuthStore;
