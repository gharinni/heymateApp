import axios from 'axios';
import { Platform } from 'react-native';

// ✅ YOUR RAILWAY BACKEND
const BASE_URL = 'https://distinguished-elegance-production.up.railway.app/api';

// ── STORAGE ───────────────────────────────────────────
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      return await AS.getItem('token');
    }
  } catch (e) {
    console.log('Token error:', e);
    return null;
  }
};

// ── AXIOS INSTANCE ────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ── REQUEST INTERCEPTOR ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR (IMPORTANT) ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API ERROR:', error?.response?.data || error.message);

    return Promise.reject(
      error?.response?.data || { message: 'Network error' }
    );
  }
);

export default api;